import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import logoImg from "@assets/QIROX_LOGO_1774316442270.png";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLocation, Link } from "wouter";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const loginSchema = z.object({
  phone: z.string().min(9, "رقم الهاتف يجب أن يتكون من 9 أرقام").regex(/^5/, "رقم الهاتف يجب أن يبدأ بـ 5"),
  password: z.string().optional(),
});

export default function Login() {
  const { login, isLoggingIn, user } = useAuth();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  if (user) {
    // Only redirect if not already at destination
    const destination = "/";
    if (window.location.pathname !== destination) {
      setLocation(destination);
    }
    return null;
  }

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    // For customers, auto-fill password with phone number
    // For staff/admin, use the entered password
    const password = isStaff ? (data.password || "") : data.phone;
    
    console.log(`[LOGIN] Attempting login for ${data.phone}, isStaff: ${isStaff}`);
    
    login({ 
      username: data.phone, 
      password: password
    }, {
      onSuccess: (userData: any) => {
        if (userData?.mustChangePassword) {
          setLocation("/profile?mustChangePassword=true");
          return;
        }
        // Redirect based on user role
        const redirectPath = userData?.redirectTo || "/";
        // Check if we're already at the location to prevent state update loops
        const currentPath = window.location.pathname;
        if (currentPath !== redirectPath) {
          setLocation(redirectPath);
        }
      },
    });
  };

  const phoneValue = form.watch("phone");
  const lastCheckedPhoneRef = useRef<string | null>(null);

  // Immediate effect to check staff status whenever phone changes
  useEffect(() => {
    const val = phoneValue.replace(/\D/g, "");
    
    // Core function to check staff
    const checkIsStaff = async (phoneNum: string) => {
      try {
        const response = await fetch(`/api/auth/check-role/${phoneNum}`);
        if (response.ok) {
          const data = await response.json();
          setIsStaff(!!data?.isStaff);
        } else {
          setIsStaff(false);
        }
      } catch (error) {
        setIsStaff(false);
      }
    };

    if (val.length === 9 && val.startsWith("5")) {
      checkIsStaff(val);
    } else if (val.length === 10 && val.startsWith("05")) {
      checkIsStaff(val.substring(1));
    } else if (val.length === 12 && val.startsWith("966")) {
      checkIsStaff(val.substring(3));
    } else {
      setIsStaff(false);
    }
  }, [phoneValue]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/">
             <img src={logoImg} alt="Qirox Studio" className="h-24 w-auto mx-auto mb-6 cursor-pointer object-contain" />
          </Link>
          <p className="text-muted-foreground">سجل دخولك برقم الهاتف للمتابعة</p>
        </div>

        <div className="bg-white border border-black/5 p-10 rounded-none shadow-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="text-right">
                    <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">رقم الهاتف</FormLabel>
                    <FormControl>
                      <div dir="ltr" className="flex items-center gap-2 h-14 bg-white border border-black/10 px-4">
                        <span className="text-sm font-bold text-black/40 border-r border-black/10 pr-2">+966</span>
                          <input
                            type="text"
                            className="flex-1 h-full bg-transparent border-none focus:outline-none text-sm font-bold tracking-widest"
                            placeholder="5x xxx xxxx"
                            maxLength={11}
                            value={field.value.replace(/(\d{2})(\d{3})(\d{4})/, "$1 $2 $3").trim()}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              let cleanVal = val;
                              if (cleanVal.startsWith("966")) {
                                cleanVal = cleanVal.substring(3);
                              }
                              if (cleanVal.startsWith("0")) {
                                cleanVal = cleanVal.substring(1);
                              }
                              if (cleanVal.length <= 9 && (cleanVal.length === 0 || cleanVal.startsWith("5"))) {
                                field.onChange(cleanVal);
                              }
                            }}
                          />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              
              {isStaff && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="text-right">
                      <div className="flex justify-between items-center mb-1">
                        <Link href="/forgot-password" className="text-[10px] font-bold uppercase tracking-widest text-black/40 hover:text-black">نسيت كلمة المرور؟</Link>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">كلمة المرور</FormLabel>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} className="h-14 bg-white border-black/10 rounded-none focus-visible:ring-black pr-12" />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 text-black/40 hover:text-black no-default-hover-elevate"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              )}

              <Button type="submit" className="w-full h-16 font-bold uppercase tracking-[0.3em] text-xs rounded-none bg-black text-white hover-elevate active-elevate-2 border-none" disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin" /> : "تسجيل الدخول"}
              </Button>
            </form>
          </Form>

          <div className="mt-10 text-center text-[10px] font-bold uppercase tracking-widest text-black/40">
            ليس لديك حساب؟{" "}
            <Link href="/register" className="text-black hover:underline ml-1">
              أنشئ حساب جديد
            </Link>
          </div>
          
          <div className="mt-6">
            <Link href="/" className="text-[10px] font-bold uppercase tracking-widest text-black/40 hover:text-black flex items-center justify-center gap-2">
              <span>العودة للرئيسية</span>
            </Link>
          </div>
          <div className="mt-8 pt-8 border-t border-black/5 text-center">
            <a href="https://api.whatsapp.com/send/?phone=966554656670" target="_blank" rel="noreferrer" className="text-[10px] font-bold uppercase tracking-widest text-black/40 hover:text-black transition-colors">
              هل تواجه مشكلة؟ تواصل مع الدعم الفني
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
