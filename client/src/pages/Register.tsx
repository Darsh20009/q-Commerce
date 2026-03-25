import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLocation, Link } from "wouter";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { useState, useRef } from "react";

export default function Register() {
  const { register, isRegistering, user } = useAuth();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  if (user) {
    // Only redirect if not already at destination
    const destination = "/";
    if (window.location.pathname !== destination) {
      setLocation(destination);
    }
    return null;
  }

  const form = useForm<z.infer<typeof insertUserSchema>>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      password: "",
      name: "",
      phone: "",
      email: "",
      role: "customer"
    },
  });

  const [isPrePopulated, setIsPrePopulated] = useState(false);
  const [employeeData, setEmployeeData] = useState<any>(null);

  const onSubmit = (data: z.infer<typeof insertUserSchema>) => {
    register({
      ...data,
      username: data.phone,
      role: employeeData?.role || "customer"
    }, {
      onSuccess: () => setLocation("/login"),
    });
  };

  const lastCheckedPhoneRef = useRef<string | null>(null);

  const checkPhone = async (phone: string) => {
    if (phone === lastCheckedPhoneRef.current) return;
    lastCheckedPhoneRef.current = phone;
    
    // Normalize phone for API check
    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = cleanPhone.substring(1);
    
    console.log("Checking phone:", cleanPhone);
    
    if (cleanPhone.length >= 9) {
      try {
        const response = await fetch(`/api/admin/users/by-phone/${cleanPhone}`);
        if (response.ok) {
          const userData = await response.json();
          console.log("Found user data:", userData);
          // If user exists and is not active (or pre-created by admin)
          if (userData.role !== "customer" && !userData.isActive) {
            setEmployeeData(userData);
            form.setValue("name", userData.name || "");
            setIsPrePopulated(true);
            // If the user already has an email in the system, pre-fill it
            if (userData.email) {
              form.setValue("email", userData.email);
            }
          } else {
            setEmployeeData(null);
            setIsPrePopulated(false);
          }
        } else {
          setEmployeeData(null);
          setIsPrePopulated(false);
        }
      } catch (error) {
        console.error("Error checking phone:", error);
      }
    } else {
      setEmployeeData(null);
      setIsPrePopulated(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/">
             <h1 className="font-display text-4xl font-bold text-primary mb-2 cursor-pointer">Qirox Studio</h1>
          </Link>
          <p className="text-muted-foreground">
            {isPrePopulated ? "تأكيد بيانات الموظف" : "أنشئ حسابك الجديد"}
          </p>
        </div>

        <div className="bg-white border border-black/5 p-10 rounded-none shadow-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {isPrePopulated && (
                <div className="bg-green-50 p-4 border border-green-100 mb-6 text-center">
                  <p className="text-green-800 font-bold text-sm">تم العثور على حساب موظف مرتبط بهذا الرقم</p>
                  <p className="text-green-600 text-[10px] mt-1">يرجى تأكيد الاسم وتعيين كلمة المرور لتفعيل الحساب</p>
                </div>
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="text-right">
                    <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">الاسم الكامل</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="فلان الفلاني" 
                        {...field} 
                        readOnly={isPrePopulated}
                        className={`h-12 bg-white border-black/10 rounded-none focus-visible:ring-black ${isPrePopulated ? 'bg-gray-50' : ''}`} 
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="text-right">
                    <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">رقم الجوال</FormLabel>
                    <FormControl>
                      <div dir="ltr" className="flex items-center gap-2 h-12 bg-white border border-black/10 px-4">
                        <span className="text-sm font-bold text-black/40 border-r border-black/10 pr-2">+966</span>
                        <input
                          type="text"
                          className="flex-1 h-full bg-transparent border-none focus:outline-none text-sm font-bold tracking-widest"
                          placeholder="5x xxx xxxx"
                          maxLength={11}
                          value={field.value.replace(/(\d{2})(\d{3})(\d{4})/, "$1 $2 $3").trim()}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            // Normalized internal value - force start with 5, remove leading 0
                            let cleanVal = val;
                            if (cleanVal.startsWith("0")) {
                              cleanVal = cleanVal.substring(1);
                            }
                            
                            // Force start with 5 if not empty
                            if (cleanVal.length > 0 && !cleanVal.startsWith("5")) {
                              cleanVal = "5" + cleanVal.substring(1);
                            }

                            if (cleanVal.length <= 9) {
                              field.onChange(cleanVal);
                              if (cleanVal.length >= 9) {
                                checkPhone(cleanVal);
                              } else {
                                setIsPrePopulated(false);
                              }
                            }
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="text-right">
                    <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="example@email.com" {...field} value={field.value || ""} className="h-12 bg-white border-black/10 rounded-none focus-visible:ring-black" />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="text-right">
                    <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">كلمة المرور الجديدة</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} className="h-12 bg-white border-black/10 rounded-none focus-visible:ring-black pr-12" />
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

              <Button type="submit" className="w-full h-16 font-bold uppercase tracking-[0.3em] text-xs rounded-none bg-black text-white hover-elevate active-elevate-2 border-none mt-4" disabled={isRegistering}>
                {isRegistering ? <Loader2 className="animate-spin" /> : (isPrePopulated ? "تفعيل الحساب" : "إنشاء الحساب")}
              </Button>
            </form>
          </Form>

          <div className="mt-10 text-center text-[10px] font-bold uppercase tracking-widest text-black/40">
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className="text-black hover:underline ml-1">
              سجل دخولك
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
