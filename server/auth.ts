import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import MemoryStoreFactory from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { UserModel } from "./models";
import { sendWelcomeEmail } from "./email";
import rateLimit from "express-rate-limit";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "محاولات تسجيل دخول كثيرة جداً، يرجى الانتظار 15 دقيقة" },
  skipSuccessfulRequests: true,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "تجاوزت حد التسجيل المسموح به" },
});

const scryptAsync = promisify(scrypt);
const MemoryStore = MemoryStoreFactory(session);

export function setupAuth(app: Express) {
  let sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret || sessionSecret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      console.error("[FATAL] SESSION_SECRET env var must be set and at least 32 characters in production");
      process.exit(1);
    }
    // In development, generate a random secret as fallback
    sessionSecret = randomBytes(32).toString("hex");
    console.warn("[AUTH] SESSION_SECRET not set — using a random secret (sessions will reset on restart)");
  }

  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === "production",
      path: '/'
    },
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessionSettings.cookie!.secure = true;
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: 'username', passwordField: 'password', passReqToCallback: false }, async (username, password, done) => {
      try {
        let cleanInput = (username || "").toString().trim().replace(/\D/g, "");

        if (cleanInput.startsWith("966")) cleanInput = cleanInput.substring(3);
        if (cleanInput.startsWith("0")) cleanInput = cleanInput.substring(1);
        cleanInput = cleanInput.replace(/\s/g, "");

        const userResult = await UserModel.findOne({
          $or: [
            { phone: cleanInput },
            { username: cleanInput },
            { phone: "0" + cleanInput },
            { username: "0" + cleanInput },
            { phone: "966" + cleanInput },
            { phone: new RegExp(cleanInput + "$") },
            { username: new RegExp(cleanInput + "$") },
            { phone: cleanInput.replace(/^0/, "") },
            { phone: "0" + cleanInput.replace(/^0/, "") }
          ]
        }).lean();

        const user = userResult ? { ...userResult, id: (userResult as any)._id.toString() } : null;

        if (user && (user as any).isActive === false) {
          return done(null, false, { message: "هذا الحساب معطل حالياً" });
        }

        const isStaffOrAdmin = user ? ["admin", "employee", "support", "cashier", "accountant"].includes(user.role) : false;

        if (isStaffOrAdmin) {
          if (!user || (user as any).isActive === false) {
            return done(null, false, { message: "الحساب غير مفعل أو البيانات غير صحيحة" });
          }

          if (!password || password === "undefined" || password === "") {
            return done(null, false, { message: "كلمة المرور مطلوبة لهذا الحساب" });
          }

          if (user.password && user.password !== "") {
            const parts = user.password.split(".");
            if (parts.length === 2) {
              const [hashedPassword, salt] = parts;
              const buffer = (await scryptAsync(password, salt, 64)) as Buffer;
              if (timingSafeEqual(Buffer.from(hashedPassword, "hex"), buffer)) {
                return done(null, user);
              }
            } else if (user.password === password) {
              // Legacy plain text support only
              return done(null, user);
            }
            return done(null, false, { message: "كلمة المرور غير صحيحة" });
          }

          return done(null, false, { message: "لم يتم تعيين كلمة مرور لهذا الحساب" });
        }

        if (!user) {
          return done(null, false, { message: "الحساب غير موجود، يرجى إنشاء حساب جديد" });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    const userId = (user as any)._id?.toString() || (user as SelectUser).id;
    done(null, userId);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) return done(null, false);
      done(null, user);
    } catch (err) {
      done(null, false);
    }
  });

  app.post("/api/auth/register", registerLimiter, async (req, res, next) => {
    try {
      const { phone, password, name } = req.body;
      if (!phone || !password || !name) {
        return res.status(400).send("جميع الحقول مطلوبة");
      }

      // Basic input validation
      if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
        return res.status(400).send("الاسم يجب أن يكون بين 2 و100 حرف");
      }
      if (typeof password !== "string" || password.length < 6 || password.length > 128) {
        return res.status(400).send("كلمة المرور يجب أن تكون بين 6 و128 حرف");
      }

      let cleanPhone = phone.toString().trim().replace(/\D/g, "");
      if (cleanPhone.startsWith("966")) cleanPhone = cleanPhone.substring(3);
      while (cleanPhone.startsWith("0")) cleanPhone = cleanPhone.substring(1);

      if (cleanPhone.length < 8 || cleanPhone.length > 10) {
        return res.status(400).send("رقم الهاتف غير صحيح");
      }

      const existingUser = await UserModel.findOne({
        $or: [
          { phone: cleanPhone },
          { username: cleanPhone },
          { phone: "0" + cleanPhone },
          { username: "0" + cleanPhone },
          { phone: { $regex: new RegExp(cleanPhone + "$") } }
        ]
      }).lean();

      if (existingUser) {
        if (existingUser.role !== "customer" && !existingUser.isActive) {
          const salt = randomBytes(16).toString("hex");
          const buffer = (await scryptAsync(password, salt, 64)) as Buffer;
          const hashedPassword = `${buffer.toString("hex")}.${salt}`;

          const updatedUser = await storage.updateUser(existingUser._id.toString(), {
            name: name.trim(),
            email: req.body.email || existingUser.email,
            password: hashedPassword,
            isActive: true
          });

          return req.login(updatedUser, (err) => {
            if (err) return next(err);
            res.status(200).json(updatedUser);
          });
        }

        return res.status(400).send("هذا الحساب مسجل ومفعل مسبقاً، يرجى تسجيل الدخول");
      }

      const salt = randomBytes(16).toString("hex");
      const buffer = (await scryptAsync(password, salt, 64)) as Buffer;
      const hashedPassword = `${buffer.toString("hex")}.${salt}`;

      const user = await storage.createUser({
        name: name.trim(),
        phone: cleanPhone,
        password: hashedPassword,
        username: cleanPhone,
        email: req.body.email || `${cleanPhone}@qiroxstudio.online`,
        role: "customer",
        walletBalance: "0",
        addresses: [],
        permissions: [],
        loginType: "dashboard",
        isActive: true,
        mustChangePassword: false,
        loyaltyPoints: 0,
        loyaltyTier: "bronze",
        totalSpent: 0,
        phoneDiscountEligible: false
      });

      if (user.email && !user.email.endsWith("@qiroxstudio.online")) {
        sendWelcomeEmail({ to: user.email, customerName: user.name || "عزيزي العميل" })
          .catch(e => console.error("[EMAIL] Welcome email failed:", e?.message));
      }

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/auth/login", loginLimiter, async (req, res, next) => {
    try {
      const { username, password } = req.body;
      if (!username) {
        return res.status(400).send("رقم الهاتف مطلوب");
      }

      let cleanInput = (username || "").toString().trim().replace(/\D/g, "");

      if (cleanInput.startsWith("966")) cleanInput = cleanInput.substring(3);
      if (cleanInput.startsWith("0")) cleanInput = cleanInput.substring(1);
      cleanInput = cleanInput.replace(/\s/g, "");

      const userResult = await UserModel.findOne({
        $or: [
          { phone: cleanInput },
          { username: cleanInput },
          { phone: "0" + cleanInput },
          { username: "0" + cleanInput },
          { phone: "966" + cleanInput },
          { phone: new RegExp(cleanInput + "$") }
        ]
      }).lean();

      const user = userResult ? {
        ...userResult,
        id: (userResult as any)._id?.toString() || (userResult as any).id,
        __v: (userResult as any).__v
      } : null;

      const isStaffRole = user && ["admin", "employee", "support", "cashier", "accountant"].includes(user.role);

      if (isStaffRole) {
        if (!password || password === "undefined") {
          return res.status(401).send("كلمة المرور مطلوبة");
        }

        if (user.password && user.password !== "") {
          const parts = user.password.split(".");
          if (parts.length === 2) {
            const [hashedPassword, salt] = parts;
            const buffer = (await scryptAsync(password, salt, 64)) as Buffer;
            if (!timingSafeEqual(Buffer.from(hashedPassword, "hex"), buffer)) {
              // Legacy plain text fallback only (no hardcoded passwords)
              if (user.password !== password) {
                return res.status(401).send("كلمة المرور غير صحيحة");
              }
            }
          } else if (user.password !== password) {
            return res.status(401).send("كلمة المرور غير صحيحة");
          }
        } else {
          return res.status(401).send("لم يتم تعيين كلمة مرور لهذا الحساب");
        }
      } else if (!user) {
        return res.status(401).send("الحساب غير موجود، يرجى إنشاء حساب جديد");
      }

      if (!user) {
        return res.status(500).send("خطأ في النظام");
      }

      const userToLogin = {
        ...user,
        id: (user as any)._id?.toString() || (user as any).id,
        __v: (user as any).__v
      };

      req.login(userToLogin as any, (err) => {
        if (err) return next(err);
        const userObj = userToLogin as any;

        if (userObj.mustChangePassword) {
          return res.status(200).json({
            ...userObj,
            mustChangePassword: true,
            redirectTo: "/profile"
          });
        }

        const isDashboardAccess = ["dashboard", "both"].includes(userObj.loginType);
        const isPosAccess = ["pos", "both"].includes(userObj.loginType);

        let redirectTo = "/";
        if (["admin", "employee", "support", "cashier", "accountant"].includes(userObj.role)) {
          if (isDashboardAccess) {
            redirectTo = "/admin";
          } else if (isPosAccess) {
            redirectTo = "/pos";
          } else {
            req.logout(() => {});
            return res.status(403).json({ message: "هذا الحساب لا يملك صلاحية الدخول للوحة التحكم أو نظام البيع" });
          }
        }

        res.status(200).json({ ...userObj, redirectTo });
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
