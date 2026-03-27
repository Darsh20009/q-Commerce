import type { Express } from "express";
import type { Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertProductSchema, insertOrderSchema, insertCouponSchema, insertCashShiftSchema, insertCategorySchema } from "@shared/schema";
import { seed } from "./seed";
import multer from "multer";
import path from "path";
import fs from "fs";
import { UserModel, NotificationModel, PushSubscriptionModel } from "./models";
import { paymentGateway } from "./payments";
import { fireNotify, fireNotifyAdmins, VAPID_PUBLIC_KEY } from "./notifications";
import {
  initiateCardPayment, verify3DS, initiateSTPay, verifySTCPay,
  processApplePay, createTamaraCheckout, confirmTamaraCheckout,
  createTabbyCheckout, confirmTabbyCheckout, getTransaction, TEST_CARD_GUIDE,
  luhnCheck, detectCardBrand
} from "./payment-simulator";
import {
  sendOrderConfirmationEmail, sendOrderStatusEmail,
  sendWelcomeEmail, sendPaymentConfirmationEmail
} from "./email";

// Configure storage for uploaded files
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage: multerStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only images (jpeg, jpg, png, webp, gif) are allowed"));
  }
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Public endpoint: check if phone belongs to a staff member (returns minimal info only)
  app.get("/api/auth/check-role/:phone", async (req, res) => {
    try {
      const { phone } = req.params;
      let cleanPhone = phone.replace(/\D/g, "");
      if (cleanPhone.startsWith("966")) cleanPhone = cleanPhone.substring(3);
      if (cleanPhone.startsWith("0")) cleanPhone = cleanPhone.substring(1);

      if (cleanPhone.length < 8 || cleanPhone.length > 10) {
        return res.json({ isStaff: false, role: "customer" });
      }

      const user = await UserModel.findOne({
        $or: [
          { phone: cleanPhone },
          { username: cleanPhone },
          { phone: "0" + cleanPhone },
          { username: "0" + cleanPhone },
          { phone: "966" + cleanPhone },
          { phone: new RegExp(cleanPhone + "$") }
        ]
      }).select("role isActive").lean();

      if (!user) return res.json({ isStaff: false, role: "customer" });

      const staffRoles = ["admin", "employee", "support", "cashier", "accountant"];
      const isStaff = staffRoles.includes(user.role);
      res.json({ isStaff, role: isStaff ? user.role : "customer" });
    } catch (err) {
      res.json({ isStaff: false, role: "customer" });
    }
  });

  // Get user by phone — requires authentication (admin/staff only)
  app.get("/api/admin/users/by-phone/:phone", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const reqUser = req.user as any;
      const isStaffUser = ["admin", "employee", "support", "cashier", "accountant"].includes(reqUser?.role);
      if (!isStaffUser) return res.sendStatus(403);

      const { phone } = req.params;
      let cleanPhone = phone.replace(/\D/g, "");
      if (cleanPhone.startsWith("966")) cleanPhone = cleanPhone.substring(3);
      if (cleanPhone.startsWith("0")) cleanPhone = cleanPhone.substring(1);

      const user = await UserModel.findOne({
        $or: [
          { phone: cleanPhone },
          { username: cleanPhone },
          { phone: "0" + cleanPhone },
          { username: "0" + cleanPhone },
          { phone: "966" + cleanPhone },
          { phone: new RegExp(cleanPhone + "$") }
        ]
      }).lean();

      if (!user) return res.status(404).send("User not found");

      res.json({
        id: (user as any)._id?.toString() || (user as any).id,
        role: user.role,
        isActive: (user as any).isActive,
        name: user.name
      });
    } catch (err) {
      console.error(`[API] Error in by-phone:`, err);
      res.status(500).send("Internal server error");
    }
  });

  // Auth setup
  setupAuth(app);
  
  // Serve uploaded files statically
  const express = await import("express");
  app.use("/uploads", express.static(uploadDir));

  // Image Upload Endpoint
  app.post("/api/upload", upload.any(), (req, res) => {
    const files = req.files as Express.Multer.File[];
    const file = files?.[0] || (req as any).file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const url = `/uploads/${file.filename}`;
    res.json({ url });
  });

  // Bank Transfer Receipt Upload
  app.post("/api/orders/:id/receipt", upload.single("receipt"), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.file) return res.status(400).json({ message: "No receipt file uploaded" });
    
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Order not found" });
      
      const user = req.user as any;
      if (user.role !== "admin" && order.userId !== user.id) {
        return res.sendStatus(403);
      }
      
      const receiptUrl = `/uploads/${req.file.filename}`;
      const updatedOrder = await storage.updateOrderReceipt(req.params.id, receiptUrl);
      res.json(updatedOrder);
    } catch (err) {
      console.error("[API] Error uploading receipt:", err);
      res.status(500).send("Internal server error");
    }
  });
  
  // Seed data
  try {
    await seed();
  } catch (err) {
    console.error("Seeding failed:", err);
  }

  // Admin Stats Dashboard
  app.get("/api/admin/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { OrderModel, ProductModel, UserModel: UM } = await import("./models");
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [allOrders, dailyOrders, monthlyOrders, totalProducts, totalCustomers] = await Promise.all([
        OrderModel.find({}).lean(),
        OrderModel.find({ createdAt: { $gte: startOfDay } }).lean(),
        OrderModel.find({ createdAt: { $gte: startOfMonth } }).lean(),
        ProductModel.countDocuments(),
        UM.countDocuments({ role: "customer" }),
      ]);

      const sumField = (orders: any[], field: string) =>
        orders.reduce((acc, o) => acc + Number(o[field] || 0), 0);

      const totalSales = sumField(allOrders, "total");
      const netProfit = sumField(allOrders, "netProfit");
      const dailySales = sumField(dailyOrders, "total");
      const monthlySales = sumField(monthlyOrders, "total");
      const totalOrders = allOrders.length;

      // Top selling products
      const productSales: Record<string, { name: string; count: number; revenue: number }> = {};
      for (const order of allOrders) {
        for (const item of (order.items || [])) {
          const key = item.productId || item.title;
          if (!productSales[key]) {
            productSales[key] = { name: item.title || key, count: 0, revenue: 0 };
          }
          productSales[key].count += item.quantity || 1;
          productSales[key].revenue += Number(item.price || 0) * (item.quantity || 1);
        }
      }
      const topProducts = Object.values(productSales)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Monthly chart data (last 6 months)
      const chartData = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const monthOrders = allOrders.filter(o => {
          const created = new Date(o.createdAt);
          return created >= d && created < end;
        });
        chartData.push({
          month: d.toLocaleDateString("ar-SA", { month: "short" }),
          sales: sumField(monthOrders, "total"),
          orders: monthOrders.length,
        });
      }

      res.json({
        totalSales,
        netProfit,
        dailySales,
        monthlySales,
        totalOrders,
        totalProducts,
        totalCustomers,
        topProducts,
        chartData,
      });
    } catch (err: any) {
      console.error("[API] admin.stats error:", err?.message);
      res.json({
        totalSales: 0, netProfit: 0, dailySales: 0, monthlySales: 0,
        totalOrders: 0, totalProducts: 0, totalCustomers: 0,
        topProducts: [], chartData: [],
      });
    }
  });

  // Middleware for granular permissions
  const checkPermission = (permission: string) => {
    return (req: any, res: any, next: any) => {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const user = req.user as any;
      if (user.role === "admin" || (user.permissions && user.permissions.includes(permission))) {
        return next();
      }
      res.status(403).json({ message: "ليس لديك صلاحية للقيام بهذا الإجراء" });
    };
  };

  // RBAC Page Protection Middleware for common admin sections
  const protectAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (user.role === "admin" || user.role === "employee" || user.role === "cashier" || user.role === "accountant" || user.role === "support") {
      return next();
    }
    res.status(403).json({ message: "دخول غير مصرح" });
  };

  // Products
  app.get(api.products.list.path, async (_req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (err: any) {
      console.error("[API] products.list error:", err?.message);
      res.json([]);
    }
  });

  app.get(api.products.get.path, async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) return res.status(404).json({ message: "Product not found" });
      res.json(product);
    } catch (err: any) {
      console.error("[API] products.get error:", err?.message);
      res.status(500).json({ message: "خطأ في جلب المنتج" });
    }
  });

  app.post(api.products.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const parsed = insertProductSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error);
      const product = await storage.createProduct(parsed.data);
      res.status(201).json(product);
    } catch (err: any) {
      console.error("[API] products.create error:", err?.message);
      res.status(500).json({ message: "خطأ في إنشاء المنتج" });
    }
  });

  app.patch("/api/products/:id", checkPermission("products.edit"), async (req, res) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
      res.json(product);
    } catch (err: any) {
      console.error("[API] products.update error:", err?.message);
      res.status(500).json({ message: "خطأ في تحديث المنتج" });
    }
  });

  app.delete("/api/products/:id", checkPermission("products.edit"), async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.sendStatus(200);
    } catch (err: any) {
      console.error("[API] products.delete error:", err?.message);
      res.status(500).json({ message: "خطأ في حذف المنتج" });
    }
  });

  // Categories
  app.get("/api/categories", async (_req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (err: any) {
      console.error("[API] categories.list error:", err?.message);
      res.status(500).json({ message: "خطأ في جلب الفئات" });
    }
  });

  app.post("/api/categories", checkPermission("products.edit"), async (req, res) => {
    try {
      const parsed = insertCategorySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "بيانات غير صحيحة", details: parsed.error.issues });
      const category = await storage.createCategory(parsed.data);
      res.status(201).json(category);
    } catch (err: any) {
      console.error("[API] categories.create error:", err?.message);
      res.status(500).json({ message: "خطأ في إنشاء الفئة" });
    }
  });

  app.patch("/api/categories/:id", checkPermission("products.edit"), async (req, res) => {
    try {
      const category = await storage.updateCategory(req.params.id, req.body);
      res.json(category);
    } catch (err: any) {
      console.error("[API] categories.update error:", err?.message);
      res.status(500).json({ message: "خطأ في تحديث الفئة" });
    }
  });

  app.delete("/api/categories/:id", checkPermission("products.edit"), async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.sendStatus(200);
    } catch (err: any) {
      console.error("[API] categories.delete error:", err?.message);
      res.status(500).json({ message: "خطأ في حذف الفئة" });
    }
  });

  // Orders
  app.get(api.orders.list.path, checkPermission("orders.view"), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = req.user as any;
      if (user.role === "admin" || (user.permissions && user.permissions.includes("orders.view"))) {
        const orders = await storage.getOrders();
        const enriched = await Promise.all(orders.map(async (order: any) => {
          if (order.customerName) return order;
          try {
            const customer = await storage.getUser(order.userId);
            return {
              ...order,
              customerName: customer?.name || "عميل زائر",
              customerPhone: customer?.phone || order.customerPhone || "",
              customerEmail: customer?.email || "",
            };
          } catch { return order; }
        }));
        res.json(enriched);
      } else {
        const orders = await storage.getOrdersByUser(user.id || user._id);
        res.json(orders);
      }
    } catch (err: any) {
      console.error("[API] orders.list error:", err?.message);
      res.json([]);
    }
  });

  app.get(api.orders.my.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = req.user as any;
      const orders = await storage.getOrdersByUser(user.id || user._id);
      res.json(orders);
    } catch (err: any) {
      console.error("[API] orders.my error:", err?.message);
      res.json([]);
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = req.user as any;
      const order = await storage.getOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "الطلب غير موجود" });
      const ownerId = (order.userId || (order as any).user)?.toString();
      const userId = (user.id || user._id)?.toString();
      const isAdmin = user.role === "admin" || user.isAdmin;
      if (!isAdmin && ownerId !== userId) return res.status(403).json({ message: "غير مصرح" });
      res.json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/verify-password", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { password } = req.body;
      if (!password) return res.status(400).send("كلمة المرور مطلوبة");
      const user = req.user as any;
      const dbUser = await storage.getUser(user.id || user._id);
      if (!dbUser || !dbUser.password) return res.status(401).send("فشل في التحقق من الحساب");
      const { scrypt, timingSafeEqual } = await import("crypto");
      const { promisify } = await import("util");
      const scryptAsync = promisify(scrypt);
      const parts = dbUser.password.split(".");
      if (parts.length === 2) {
        const [hashedPassword, salt] = parts;
        const buffer = (await scryptAsync(password, salt, 64)) as Buffer;
        if (timingSafeEqual(Buffer.from(hashedPassword, "hex"), buffer)) return res.json({ success: true });
      } else if (dbUser.password === password) return res.json({ success: true });
      res.status(401).send("كلمة المرور غير صحيحة");
    } catch (err: any) {
      console.error("[API] verify-password error:", err?.message);
      res.status(500).send("خطأ في التحقق");
    }
  });

  app.post(api.orders.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const parsed = insertOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        console.error("[API] orders.create validation error:", JSON.stringify(parsed.error.issues));
        return res.status(400).json({ message: "بيانات الطلب غير مكتملة أو غير صحيحة", details: parsed.error.issues });
      }
      if (parsed.data.paymentMethod === "wallet" && parsed.data.userId) {
        const user = await storage.getUser(parsed.data.userId);
        if (user) {
          const balance = Number(user.walletBalance || 0);
          const orderTotal = Number(parsed.data.total);
          if (balance < orderTotal) return res.status(400).json({ message: "رصيد المحفظة غير كافٍ" });
          await storage.updateUserWallet(user.id, (balance - orderTotal).toString());
          await storage.createWalletTransaction({
            userId: user.id,
            amount: orderTotal,
            type: "withdrawal",
            description: `دفع طلب POS #${new Date().getTime()}`,
          });
        }
      }
      const user = req.user as any;
      const order = await storage.createOrder({
        ...parsed.data,
        type: parsed.data.type || "online",
        branchId: parsed.data.branchId || user.branchId,
        cashierId: parsed.data.cashierId || user.id,
      });

      // Notify admins of new order
      try {
        await fireNotifyAdmins(
          "🛒 طلب جديد",
          `طلب جديد بقيمة ${order.total} ر.س — ${order.paymentMethod}`,
          { type: "info", link: "/admin", icon: "🛒", webPush: true }
        );
        // Notify customer that order was received
        await fireNotify(
          order.userId,
          "✅ تم استلام طلبك",
          `طلبك رقم #${order.id.slice(-6).toUpperCase()} بقيمة ${order.total} ر.س في انتظار المراجعة.`,
          { type: "success", link: "/orders", icon: "✅", webPush: true }
        );
      } catch (notifErr) {
        console.error("[NOTIFY] Failed to send order notifications:", notifErr);
      }

      // Send order confirmation email
      try {
        const customer = await storage.getUser(order.userId);
        if (customer?.email) {
          const orderRef = order.id.slice(-8).toUpperCase();
          await sendOrderConfirmationEmail({
            to: customer.email,
            customerName: customer.name || "عزيزي العميل",
            orderId: order.id,
            orderRef,
            items: (order.items || []).map((item: any) => ({
              title: item.title || "",
              quantity: item.quantity || 1,
              price: item.price || 0,
              color: item.color,
              size: item.size,
            })),
            subtotal: Number(order.subtotal) || 0,
            vatAmount: Number(order.vatAmount) || 0,
            shippingCost: Number(order.shippingCost) || 0,
            discountAmount: Number(order.discountAmount) || 0,
            total: Number(order.total) || 0,
            paymentMethod: order.paymentMethod || "unknown",
            deliveryAddress: order.deliveryAddress || "",
            shippingCompany: order.shippingCompany,
          });
        }
      } catch (emailErr: any) {
        console.error("[EMAIL] Order confirmation error:", emailErr?.message);
      }

      try {
        await storage.createInvoice({
          userId: order.userId,
          orderId: order.id,
          invoiceNumber: `INV-${Date.now()}-${order.id.slice(-4).toUpperCase()}`,
          issueDate: new Date(),
          status: order.paymentStatus === "paid" ? "paid" : "issued",
          items: order.items.map((item: any) => ({
            description: item.title,
            quantity: item.quantity,
            unitPrice: item.price,
            taxRate: 15,
            taxAmount: Number((item.price * item.quantity * 0.15).toFixed(2)),
            total: Number((item.price * item.quantity * 1.15).toFixed(2)),
          })),
          subtotal: Number(order.subtotal),
          taxTotal: Number(order.vatAmount),
          total: Number(order.total),
          notes: `فاتورة مرتبطة بالطلب #${order.id.slice(-6).toUpperCase()}`
        });
      } catch (invErr) {
        console.error("[INVOICE] Failed to auto-generate invoice:", invErr);
      }

      res.status(201).json(order);
    } catch (err: any) {
      console.error("[API] orders.create error:", err?.message);
      res.status(500).json({ message: "خطأ في إنشاء الطلب" });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = req.user as any;
      if (user.role !== "admin") return res.sendStatus(403);
      const { status, shippingProvider, trackingNumber, deliveryDriverName, deliveryDriverPhone, note } = req.body;

      const order = await storage.updateOrderStatus(req.params.id, status, {
        provider: shippingProvider,
        tracking: trackingNumber,
        deliveryDriver: status === "out_for_delivery" && deliveryDriverName ? { name: deliveryDriverName, phone: deliveryDriverPhone, assignedAt: new Date() } : undefined,
        historyNote: note,
      });

      // Notify customer of status change
      const statusLabels: Record<string, { title: string; body: string; icon: string; type: "info" | "success" | "warning" | "error" }> = {
        processing: { title: "⚙️ جاري تجهيز طلبك", body: `طلبك #${order.id.slice(-6).toUpperCase()} قيد التجهيز الآن.`, icon: "⚙️", type: "info" },
        out_for_delivery: {
          title: "🛵 السائق في طريقه إليك!",
          body: `طلبك #${order.id.slice(-6).toUpperCase()} خرج للتوصيل${deliveryDriverName ? ` مع ${deliveryDriverName}` : ""}. كن جاهزاً!`,
          icon: "🛵", type: "success"
        },
        shipped: { title: "🚚 طلبك في الطريق", body: `تم شحن طلبك #${order.id.slice(-6).toUpperCase()}${trackingNumber ? ` — رقم التتبع: ${trackingNumber}` : ""}`, icon: "🚚", type: "success" },
        completed: { title: "✅ تم تسليم طلبك", body: `تم تسليم طلبك #${order.id.slice(-6).toUpperCase()} بنجاح. شكراً لثقتك!`, icon: "✅", type: "success" },
        cancelled: { title: "❌ تم إلغاء طلبك", body: `تم إلغاء طلبك #${order.id.slice(-6).toUpperCase()}.`, icon: "❌", type: "error" },
      };
      const label = statusLabels[status];
      if (label) {
        try {
          await fireNotify(order.userId, label.title, label.body, {
            type: label.type, link: "/orders", icon: label.icon, webPush: true,
          });
        } catch {}

        // Send status update email
        try {
          const customer = await storage.getUser(order.userId);
          if (customer?.email && ["processing", "shipped", "completed", "cancelled", "out_for_delivery"].includes(status)) {
            await sendOrderStatusEmail({
              to: customer.email,
              customerName: customer.name || "عزيزي العميل",
              orderRef: order.id.slice(-8).toUpperCase(),
              status: status as any,
              trackingNumber,
              shippingProvider,
            });
          }
        } catch (emailErr: any) {
          console.error("[EMAIL] Status update error:", emailErr?.message);
        }
      }

      res.json(order);
    } catch (err: any) {
      console.error("[API] orders.status error:", err?.message);
      res.status(500).json({ message: "خطأ في تحديث حالة الطلب" });
    }
  });

  // ─── Admin Broadcast Notification to Customers ───────────────────────────
  app.post("/api/admin/broadcast", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const admin = req.user as any;
      if (admin.role !== "admin") return res.sendStatus(403);
      const { title, body, type = "info", link = "/", targetUserId } = req.body;
      if (!title || !body) return res.status(400).json({ message: "title و body مطلوبان" });

      if (targetUserId) {
        await fireNotify(targetUserId, title, body, { type, link, webPush: true });
        return res.json({ sent: 1 });
      }

      // Broadcast to ALL users
      const { UserModel } = await import("./models");
      const users = await UserModel.find({ role: { $ne: "admin" } }).select("_id").lean();
      let sent = 0;
      await Promise.allSettled(
        users.map(async (u: any) => {
          try {
            await fireNotify(String(u._id), title, body, { type, link, webPush: true });
            sent++;
          } catch {}
        })
      );
      res.json({ sent });
    } catch (err: any) {
      console.error("[API] broadcast error:", err?.message);
      res.status(500).json({ message: "خطأ في إرسال الإشعار" });
    }
  });

  // ─── Confirm / Reject bank-transfer payment ───────────────────────────────
  app.patch("/api/orders/:id/confirm-payment", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = req.user as any;
      if (user.role !== "admin") return res.sendStatus(403);
      const { action } = req.body; // "confirm" | "reject"
      if (!["confirm", "reject"].includes(action))
        return res.status(400).json({ message: "action must be confirm or reject" });

      const order = await storage.getOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Order not found" });

      let updatedOrder: any;
      if (action === "confirm") {
        updatedOrder = await storage.updateOrderPaymentStatus(req.params.id, "paid");
        // updateOrderPaymentStatus already sets status = "processing" when paid
        try {
          await fireNotify(
            order.userId,
            "✅ تم تأكيد دفعتك",
            `تم التحقق من إيصال التحويل البنكي لطلبك #${order.id.slice(-6).toUpperCase()} وجاري التجهيز الآن.`,
            { type: "success", link: "/orders", icon: "✅", webPush: true }
          );
          const customer = await storage.getUser(order.userId);
          if (customer?.email) {
            await sendOrderStatusEmail({
              to: customer.email,
              customerName: customer.name || "عزيزي العميل",
              orderRef: order.id.slice(-8).toUpperCase(),
              status: "processing",
            });
          }
        } catch {}
      } else {
        // reject → cancel order and mark payment failed
        await storage.updateOrderPaymentStatus(req.params.id, "failed");
        updatedOrder = await storage.updateOrderStatus(req.params.id, "cancelled");
        try {
          await fireNotify(
            order.userId,
            "❌ تعذّر تأكيد الدفع",
            `لم يتم التحقق من إيصال التحويل البنكي لطلبك #${order.id.slice(-6).toUpperCase()}. يرجى التواصل معنا.`,
            { type: "error", link: "/orders", icon: "❌", webPush: true }
          );
          const customer = await storage.getUser(order.userId);
          if (customer?.email) {
            await sendOrderStatusEmail({
              to: customer.email,
              customerName: customer.name || "عزيزي العميل",
              orderRef: order.id.slice(-8).toUpperCase(),
              status: "cancelled",
            });
          }
        } catch {}
      }

      res.json(updatedOrder);
    } catch (err: any) {
      console.error("[API] confirm-payment error:", err?.message);
      res.status(500).json({ message: "خطأ في تأكيد الدفع" });
    }
  });

  app.post("/api/verify-reset", async (req, res) => {
    const { phone, name } = req.body;
    if (!phone || !name) {
      return res.status(400).json({ message: "جميع الحقول مطلوبة" });
    }
    try {
      const cleanPhone = phone.replace(/\D/g, "");
      const corePhone = cleanPhone.startsWith("0") ? cleanPhone.substring(1) : cleanPhone;
      
      console.log(`[RESET] Verifying user: Name="${name}", Phone="${phone}" (Core: "${corePhone}")`);
      
      const user = await UserModel.findOne({
        $and: [
          { name: { $regex: new RegExp(`^${name}$`, "i") } },
          { 
            $or: [
              { phone: corePhone },
              { phone: "0" + corePhone },
              { username: corePhone },
              { username: "0" + corePhone }
            ]
          }
        ]
      }).lean();

      if (!user) {
        console.log(`[RESET] Verification failed for: ${name} / ${phone}`);
        return res.status(404).json({ message: "المعلومات غير متطابقة" });
      }
      
      console.log(`[RESET] User verified: ${user._id}`);
      res.json({ id: user._id.toString() });
    } catch (err: any) {
      console.error("[RESET] verify-reset error:", err?.message);
      res.status(500).json({ message: "خطأ في التحقق من الهوية" });
    }
  });

  app.post("/api/reset-password", async (req, res) => {
    const { id, password } = req.body;
    if (!id || !password) {
      return res.status(400).json({ message: "بيانات غير مكتملة" });
    }
    
    try {
      // Hash the new password before saving
      const { scrypt, randomBytes } = await import("crypto");
      const { promisify } = await import("util");
      const scryptAsync = promisify(scrypt);
      
      const salt = randomBytes(16).toString("hex");
      const buffer = (await scryptAsync(password, salt, 64)) as Buffer;
      const hashedPassword = `${buffer.toString("hex")}.${salt}`;
      
      console.log(`[RESET] Updating password for user: ${id}`);
      // Use UserModel directly to ensure immediate update with correct field names
      const result = await UserModel.findByIdAndUpdate(id, { 
        password: hashedPassword,
        mustChangePassword: false 
      }, { new: true });

      if (!result) {
        return res.status(404).send("المستخدم غير موجود");
      }
      
      res.json({ message: "تم تحديث كلمة المرور بنجاح" });
    } catch (err: any) {
      console.error(`[RESET] Error updating password:`, err);
      res.status(500).send("فشل تحديث كلمة المرور");
    }
  });

  // Audit Logs
  app.get("/api/admin/audit-logs", checkPermission("staff.manage"), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const logs = await storage.getAuditLogs(100);
      res.json(logs);
    } catch (err: any) {
      console.error("[API] audit-logs error:", err?.message);
      res.json([]);
    }
  });

  // Branches
  app.get("/api/branches", async (_req, res) => {
    try {
      const branches = await storage.getBranches();
      res.json(branches);
    } catch (err: any) {
      console.error("[API] branches.list error:", err?.message);
      res.json([]);
    }
  });

  app.post("/api/admin/branches", checkPermission("settings.manage"), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const branch = await storage.createBranch(req.body);
      res.status(201).json(branch);
    } catch (err: any) {
      console.error("[API] branches.create error:", err?.message);
      res.status(500).json({ message: "خطأ في إنشاء الفرع" });
    }
  });

  app.patch("/api/admin/branches/:id", checkPermission("settings.manage"), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const branch = await storage.updateBranch(req.params.id, req.body);
      res.json(branch);
    } catch (err: any) {
      console.error("[API] branches.update error:", err?.message);
      res.status(500).json({ message: "خطأ في تحديث الفرع" });
    }
  });

  // Cash Shifts
  app.get("/api/pos/shifts/active", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = req.user as any;
      const shift = await storage.getActiveShift(user.id || user._id);
      res.json(shift || null);
    } catch (err: any) {
      console.error("[API] shifts.active error:", err?.message);
      res.json(null);
    }
  });

  app.post("/api/pos/shifts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = req.user as any;
      const shift = await storage.createCashShift({
        ...req.body,
        cashierId: user.id || user._id,
        openedAt: new Date(),
        status: "open"
      });
      res.status(201).json(shift);
    } catch (err: any) {
      console.error("[API] shifts.create error:", err?.message);
      res.status(500).json({ message: "خطأ في فتح الوردية" });
    }
  });

  // Staff Management
  app.get("/api/admin/users", checkPermission("staff.manage"), async (_req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (err: any) {
      console.error("[API] admin.users error:", err?.message);
      res.json([]);
    }
  });

  app.post("/api/admin/users", checkPermission("staff.manage"), async (req, res) => {
    try {
      const userData = req.body;
      let phone = (userData.phone || "").replace(/\D/g, "");
      if (phone.startsWith("0")) phone = phone.substring(1);
      const email = userData.email || `${phone}@qiroxstudio.online`;
      const username = userData.username || phone;

      const existingUser = await storage.getUserByUsername(phone);
      if (existingUser) {
        if (existingUser.role !== "customer" && existingUser.role !== "admin") {
           return res.status(400).send("مستخدم بهذا الرقم موجود بالفعل كـ " + existingUser.role);
        }
        const updatedUser = await storage.updateUser(existingUser.id, {
          ...userData,
          role: userData.role || "employee",
          isActive: true
        });
        return res.json(updatedUser);
      }

      const { scrypt, randomBytes } = await import("crypto");
      const { promisify } = await import("util");
      const scryptAsync = promisify(scrypt);
      const defaultPassword = "2030";
      const salt = randomBytes(16).toString("hex");
      const buffer = (await scryptAsync(defaultPassword, salt, 64)) as Buffer;
      const hashedPassword = `${buffer.toString("hex")}.${salt}`;

      const user = await storage.createUser({
        ...userData,
        phone,
        email,
        username,
        password: hashedPassword,
        walletBalance: "0",
        mustChangePassword: true,
        isActive: true,
        role: userData.role || "employee",
        addresses: [],
        permissions: userData.permissions || []
      });
      res.status(201).json(user);
    } catch (err: any) {
      res.status(400).send(err.message);
    }
  });

  app.patch("/api/admin/users/:id", checkPermission("staff.manage"), async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      res.json(user);
    } catch (err: any) {
      console.error("[API] admin.users.update error:", err?.message);
      res.status(500).json({ message: "خطأ في تحديث المستخدم" });
    }
  });

  app.delete("/api/admin/users/:id", checkPermission("staff.manage"), async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.sendStatus(200);
    } catch (err: any) {
      console.error("[API] admin.users.delete error:", err?.message);
      res.status(500).json({ message: "خطأ في حذف المستخدم" });
    }
  });

  // Roles
  app.get("/api/admin/roles", checkPermission("staff.manage"), async (_req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (err: any) {
      console.error("[API] roles.list error:", err?.message);
      res.json([]);
    }
  });

  app.post("/api/admin/roles", checkPermission("staff.manage"), async (req, res) => {
    try {
      const role = await storage.createRole(req.body);
      res.status(201).json(role);
    } catch (err: any) {
      console.error("[API] roles.create error:", err?.message);
      res.status(500).json({ message: "خطأ في إنشاء الدور" });
    }
  });

  app.patch("/api/pos/shifts/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const shift = await storage.updateCashShift(req.params.id, req.body);
      res.json(shift);
    } catch (err: any) {
      console.error("[API] shifts.update error:", err?.message);
      res.status(500).json({ message: "خطأ في تحديث الوردية" });
    }
  });

  // Wallet Transactions
  app.get("/api/wallet/transactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = req.user as any;
      const transactions = await storage.getWalletTransactions(user.id);
      res.json(transactions);
    } catch (err: any) {
      console.error("[API] wallet.transactions error:", err?.message);
      res.json([]);
    }
  });

  // Shipping Companies
  app.get("/api/shipping-companies", async (req, res) => {
    try {
      const companies = await storage.getShippingCompanies();
      res.json(companies);
    } catch (err: any) {
      console.error("[API] shipping-companies.list error:", err?.message);
      res.json([]);
    }
  });

  app.post("/api/shipping-companies", checkPermission("settings.manage"), async (req, res) => {
    try {
      const company = await storage.createShippingCompany(req.body);
      res.status(201).json(company);
    } catch (err: any) {
      console.error("[API] shipping-companies.create error:", err?.message);
      res.status(500).json({ message: "خطأ في إنشاء شركة الشحن" });
    }
  });

  app.patch("/api/shipping-companies/:id", checkPermission("settings.manage"), async (req, res) => {
    try {
      const company = await storage.updateShippingCompany(req.params.id, req.body);
      res.json(company);
    } catch (err: any) {
      console.error("[API] shipping-companies.update error:", err?.message);
      res.status(500).json({ message: "خطأ في تحديث شركة الشحن" });
    }
  });

  app.delete("/api/shipping-companies/:id", checkPermission("settings.manage"), async (req, res) => {
    try {
      await storage.deleteShippingCompany(req.params.id);
      res.json({ ok: true });
    } catch (err: any) {
      console.error("[API] shipping-companies.delete error:", err?.message);
      res.status(500).json({ message: "خطأ في حذف شركة الشحن" });
    }
  });

  // ─── Wishlist ──────────────────────────────────────────────────────────────
  app.get("/api/wishlist/ids", async (req, res) => {
    if (!req.isAuthenticated()) return res.json([]);
    try {
      const user = req.user as any;
      const ids = await storage.getWishlistProductIds(user.id);
      res.json(ids);
    } catch (err: any) {
      res.json([]);
    }
  });

  app.get("/api/wishlist", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = req.user as any;
      const items = await storage.getWishlist(user.id);
      const products = await Promise.all(items.map(i => storage.getProduct(i.productId)));
      res.json(products.filter(Boolean));
    } catch (err: any) {
      res.json([]);
    }
  });

  app.post("/api/wishlist", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = req.user as any;
      await storage.addToWishlist(user.id, req.body.productId);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: "خطأ في إضافة المنتج للمفضلة" });
    }
  });

  app.delete("/api/wishlist/:productId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = req.user as any;
      await storage.removeFromWishlist(user.id, req.params.productId);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: "خطأ في إزالة المنتج من المفضلة" });
    }
  });

  // ─── Product Reviews ────────────────────────────────────────────────────────
  app.get("/api/products/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getProductReviews(req.params.id);
      res.json(reviews);
    } catch (err: any) {
      res.json([]);
    }
  });

  app.post("/api/products/:id/reviews", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = req.user as any;
      const existing = await storage.getUserReviewForProduct(user.id, req.params.id);
      if (existing) return res.status(409).json({ message: "لقد قمت بتقييم هذا المنتج مسبقاً" });
      const review = await storage.createProductReview({
        productId: req.params.id,
        userId: user.id,
        userName: user.name || "عميل",
        rating: Number(req.body.rating),
        comment: req.body.comment || "",
      });
      res.status(201).json(review);
    } catch (err: any) {
      res.status(500).json({ message: "خطأ في إضافة التقييم" });
    }
  });

  // ─── Low Stock ───────────────────────────────────────────────────────────────
  app.get("/api/admin/low-stock", checkPermission("products.view"), async (req, res) => {
    try {
      const threshold = parseInt(req.query.threshold as string) || 5;
      const products = await storage.getLowStockProducts(threshold);
      res.json(products);
    } catch (err: any) {
      res.json([]);
    }
  });

  // Invoices — accessible by all authenticated users (admins see all, others see their own)
  app.get("/api/invoices", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = req.user as any;
      const invoices = await storage.getInvoices(user.role === "admin" ? undefined : user.id);
      res.json(invoices);
    } catch (err: any) {
      console.error("[API] invoices.list error:", err?.message);
      res.json([]);
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) return res.status(404).send("Invoice not found");
      res.json(invoice);
    } catch (err: any) {
      console.error("[API] invoices.get error:", err?.message);
      res.status(500).json({ message: "خطأ في جلب الفاتورة" });
    }
  });

  // ─── Notifications ────────────────────────────────────────────────────────
  // VAPID Public Key (needed by client to subscribe to web push)
  app.get("/api/notifications/vapid-public-key", (_req, res) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY });
  });

  // Get my notifications (paginated, newest first)
  app.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = req.user as any;
      const userId = user.id || user._id;
      const notifications = await NotificationModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      const unreadCount = await NotificationModel.countDocuments({ userId, isRead: false });
      res.json({ notifications, unreadCount });
    } catch (err: any) {
      console.error("[API] notifications.list error:", err?.message);
      res.json({ notifications: [], unreadCount: 0 });
    }
  });

  // Mark one notification as read
  app.patch("/api/notifications/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = req.user as any;
      await NotificationModel.findOneAndUpdate(
        { _id: req.params.id, userId: user.id || user._id },
        { isRead: true }
      );
      res.json({ ok: true });
    } catch (err: any) {
      console.error("[API] notifications.read error:", err?.message);
      res.status(500).json({ ok: false });
    }
  });

  // Mark all notifications as read
  app.patch("/api/notifications/read-all", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = req.user as any;
      await NotificationModel.updateMany(
        { userId: user.id || user._id, isRead: false },
        { isRead: true }
      );
      res.json({ ok: true });
    } catch (err: any) {
      console.error("[API] notifications.read-all error:", err?.message);
      res.status(500).json({ ok: false });
    }
  });

  // Delete a notification
  app.delete("/api/notifications/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = req.user as any;
      await NotificationModel.findOneAndDelete({ _id: req.params.id, userId: user.id || user._id });
      res.json({ ok: true });
    } catch (err: any) {
      console.error("[API] notifications.delete error:", err?.message);
      res.status(500).json({ ok: false });
    }
  });

  // Save Web Push subscription
  app.post("/api/notifications/subscribe", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = req.user as any;
      const userId = user.id || user._id;
      const { endpoint, keys } = req.body;
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return res.status(400).json({ message: "بيانات الاشتراك غير مكتملة" });
      }
      await PushSubscriptionModel.findOneAndUpdate(
        { endpoint },
        { userId, endpoint, keys },
        { upsert: true, new: true }
      );
      res.json({ ok: true });
    } catch (err: any) {
      console.error("[API] push.subscribe error:", err?.message);
      res.status(500).json({ ok: false });
    }
  });

  // Remove Web Push subscription (on logout or disable)
  app.delete("/api/notifications/subscribe", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { endpoint } = req.body;
      if (endpoint) await PushSubscriptionModel.deleteOne({ endpoint });
      res.json({ ok: true });
    } catch (err: any) {
      console.error("[API] push.unsubscribe error:", err?.message);
      res.status(500).json({ ok: false });
    }
  });

  // Admin: send manual notification to a user
  app.post("/api/admin/notify", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const reqUser = req.user as any;
    if (reqUser.role !== "admin") return res.sendStatus(403);
    try {
      const { userId, title, body, type, link } = req.body;
      if (!userId || !title || !body) return res.status(400).json({ message: "بيانات ناقصة" });
      await fireNotify(userId, title, body, { type: type || "info", link: link || "" });
      res.json({ ok: true });
    } catch (err: any) {
      console.error("[API] admin.notify error:", err?.message);
      res.status(500).json({ ok: false });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // PAYMENT GATEWAY — Full Simulator Routes
  // ─────────────────────────────────────────────────────────────

  // Test card guide for admin/testing
  app.get("/api/pay/test-cards", (_req, res) => {
    res.json({ cards: TEST_CARD_GUIDE, stcOtp: "1234", otp3ds: "123456" });
  });

  // Card validation (live feedback)
  app.post("/api/pay/validate-card", (req, res) => {
    try {
      const { cardNumber } = req.body;
      if (!cardNumber) return res.status(400).json({ valid: false });
      const num = cardNumber.replace(/\D/g, "");
      const valid = luhnCheck(num);
      const brand = detectCardBrand(num);
      res.json({ valid, brand });
    } catch (err: any) {
      res.status(500).json({ valid: false, error: err.message });
    }
  });

  // Initiate card payment
  app.post("/api/pay/card", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { orderId, amount, cardNumber, cardHolderName, expiryMonth, expiryYear, cvv } = req.body;
      if (!orderId || !amount || !cardNumber || !cvv) {
        return res.status(400).json({ success: false, error: "بيانات البطاقة ناقصة" });
      }
      // Simulate realistic processing delay
      await new Promise(r => setTimeout(r, 1800 + Math.random() * 1200));
      const result = await initiateCardPayment({ orderId, amount, cardNumber, cardHolderName, expiryMonth, expiryYear, cvv }) as any;

      // If card charged directly without 3DS, send payment confirmation
      if (result.success && !result.requires3DS) {
        try {
          const u = req.user as any;
          if (u?.email) {
            await sendPaymentConfirmationEmail({
              to: u.email,
              customerName: u.name || "عزيزي العميل",
              orderRef: String(orderId).slice(-8).toUpperCase(),
              amount: Number(amount),
              paymentMethod: "card",
              transactionId: result.transactionId,
              authCode: result.authCode,
            });
          }
        } catch (e: any) { console.error("[EMAIL] Payment confirm card:", e?.message); }
      }

      res.json(result);
    } catch (err: any) {
      console.error("[API] pay.card error:", err?.message);
      res.status(500).json({ success: false, error: "خطأ في معالجة الدفع، حاول مجدداً" });
    }
  });

  // Verify 3DS OTP
  app.post("/api/pay/card/3ds", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { transactionId, otp } = req.body;
      if (!transactionId || !otp) return res.status(400).json({ success: false, error: "بيانات ناقصة" });
      await new Promise(r => setTimeout(r, 1200));
      const result = await verify3DS(transactionId, otp) as any;

      // Send payment confirmation email on success
      if (result.success) {
        try {
          const u = req.user as any;
          if (u?.email) {
            await sendPaymentConfirmationEmail({
              to: u.email,
              customerName: u.name || "عزيزي العميل",
              orderRef: result.orderId ? String(result.orderId).slice(-8).toUpperCase() : transactionId.slice(-8).toUpperCase(),
              amount: result.amount || 0,
              paymentMethod: "card",
              transactionId: result.transactionId || transactionId,
              authCode: result.authCode,
            });
          }
        } catch (e: any) { console.error("[EMAIL] Payment confirm 3ds:", e?.message); }
      }

      res.json(result);
    } catch (err: any) {
      console.error("[API] pay.3ds error:", err?.message);
      res.status(500).json({ success: false, error: "خطأ في التحقق" });
    }
  });

  // Initiate STC Pay (sends OTP)
  app.post("/api/pay/stc/initiate", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { orderId, amount, phone } = req.body;
      if (!orderId || !amount || !phone) return res.status(400).json({ success: false, error: "بيانات ناقصة" });
      await new Promise(r => setTimeout(r, 1000));
      const result = await initiateSTPay({ orderId, amount, phone });
      res.json(result);
    } catch (err: any) {
      console.error("[API] pay.stc.initiate error:", err?.message);
      res.status(500).json({ success: false, error: "خطأ في إرسال OTP" });
    }
  });

  // Verify STC Pay OTP
  app.post("/api/pay/stc/verify", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { sessionToken, otp, orderId, amount } = req.body;
      if (!sessionToken || !otp) return res.status(400).json({ success: false, error: "بيانات ناقصة" });
      await new Promise(r => setTimeout(r, 1000));
      const result = await verifySTCPay({ sessionToken, otp }) as any;

      if (result.success) {
        try {
          const u = req.user as any;
          if (u?.email) {
            await sendPaymentConfirmationEmail({
              to: u.email,
              customerName: u.name || "عزيزي العميل",
              orderRef: orderId ? String(orderId).slice(-8).toUpperCase() : sessionToken.slice(-8).toUpperCase(),
              amount: amount || result.amount || 0,
              paymentMethod: "stc_pay",
              transactionId: result.transactionId || sessionToken,
              authCode: result.authCode,
            });
          }
        } catch (e: any) { console.error("[EMAIL] Payment confirm stc:", e?.message); }
      }

      res.json(result);
    } catch (err: any) {
      console.error("[API] pay.stc.verify error:", err?.message);
      res.status(500).json({ success: false, error: "خطأ في التحقق" });
    }
  });

  // Apple Pay
  app.post("/api/pay/apple-pay", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { orderId, amount } = req.body;
      if (!orderId || !amount) return res.status(400).json({ success: false, error: "بيانات ناقصة" });
      const result = await processApplePay({ orderId, amount }) as any;

      if (result.success) {
        try {
          const u = req.user as any;
          if (u?.email) {
            await sendPaymentConfirmationEmail({
              to: u.email,
              customerName: u.name || "عزيزي العميل",
              orderRef: String(orderId).slice(-8).toUpperCase(),
              amount: Number(amount),
              paymentMethod: "apple_pay",
              transactionId: result.transactionId,
              authCode: result.authCode,
            });
          }
        } catch (e: any) { console.error("[EMAIL] Payment confirm apple:", e?.message); }
      }

      res.json(result);
    } catch (err: any) {
      console.error("[API] pay.apple-pay error:", err?.message);
      res.status(500).json({ success: false, error: "خطأ في Apple Pay" });
    }
  });

  // Tamara BNPL
  app.post("/api/payments/tamara/checkout", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { orderId, amount, customer, installments } = req.body;
      if (!orderId || !amount) return res.status(400).json({ success: false, error: "بيانات ناقصة" });
      const result = await createTamaraCheckout({
        orderId, amount,
        customer: customer || { name: "Customer", phone: "", email: "" },
        installments: installments || 4
      });
      res.json(result);
    } catch (err: any) {
      console.error("[API] pay.tamara error:", err?.message);
      res.status(500).json({ success: false, error: "خطأ في تمارة" });
    }
  });

  app.post("/api/payments/tamara/confirm", async (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) return res.status(400).json({ success: false });
      await new Promise(r => setTimeout(r, 1500));
      const result = await confirmTamaraCheckout(sessionId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Tabby BNPL
  app.post("/api/payments/tabby/checkout", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { orderId, amount, customer } = req.body;
      if (!orderId || !amount) return res.status(400).json({ success: false, error: "بيانات ناقصة" });
      const result = await createTabbyCheckout({
        orderId, amount,
        customer: customer || { name: "Customer", phone: "", email: "" }
      });
      res.json(result);
    } catch (err: any) {
      console.error("[API] pay.tabby error:", err?.message);
      res.status(500).json({ success: false, error: "خطأ في تابي" });
    }
  });

  app.post("/api/payments/tabby/confirm", async (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) return res.status(400).json({ success: false });
      await new Promise(r => setTimeout(r, 1500));
      const result = await confirmTabbyCheckout(sessionId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get transaction status
  app.get("/api/pay/transaction/:id", (req, res) => {
    try {
      const tx = getTransaction(req.params.id);
      if (!tx) return res.status(404).json({ error: "العملية غير موجودة" });
      res.json(tx);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── AI Endpoints ────────────────────────────────────────────

  app.post("/api/ai/size-advisor", async (req, res) => {
    try {
      const { getSizeRecommendation } = await import("./ai");
      const result = await getSizeRecommendation(req.body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/ai/insights", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { getBusinessInsights } = await import("./ai");
      const result = await getBusinessInsights(req.body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/ai/generate-description", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { generateProductDescription } = await import("./ai");
      const result = await generateProductDescription(req.body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/ai/outfit-suggestions", async (req, res) => {
    try {
      const { getOutfitSuggestions } = await import("./ai");
      const result = await getOutfitSuggestions(req.body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Store Settings ──────────────────────────────────────────

  app.get("/api/store/settings", async (_req, res) => {
    try {
      const settings = await storage.getStoreSettings();
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/store/settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (user.role !== "admin") return res.sendStatus(403);
    try {
      const updated = await storage.updateStoreSettings(req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ─────────────────────────────────────────────────────────────

  app.post("/api/shipping/storage-station/create-order", checkPermission("orders.edit"), async (_req, res) => {
    res.json({ success: true, trackingNumber: "SS-" + Math.random().toString(36).substring(7).toUpperCase(), message: "Storage Station B20 stubbed" });
  });

  return httpServer;
}
