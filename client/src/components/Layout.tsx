import logoImg from "@assets/QIROX_LOGO_1774316442270.png";
import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingBag, User, Menu, LogOut, Sun, Moon, Phone, Mail, Instagram, Twitter, Download, Globe, Check, Wallet, Home, Package, LayoutDashboard, ChevronRight, X, Zap, Star, HelpCircle, Shield, Settings2, Tag, Heart } from "lucide-react";
import { SiTiktok, SiSnapchat, SiWhatsapp, SiX } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useTheme } from "@/components/theme-provider";
import { useLanguage } from "@/hooks/use-language";
import { NotificationBell } from "@/components/notification-bell";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const cartItems = useCart((state) => state.items);
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data: allOrders } = useQuery<any[]>({
    queryKey: ["/api/orders"],
    queryFn: async () => { const r = await fetch("/api/orders"); return r.ok ? r.json() : []; },
    enabled: !!user && user.role === "admin",
    refetchInterval: 30000,
  });
  const pendingAdminCount = (allOrders || []).filter((o: any) => o.status === "pending_payment").length;

  useEffect(() => {
    if (user?.role === "admin" && pendingAdminCount > 0) {
      document.title = `(${pendingAdminCount}) لوحة التحكم | Qirox Studio`;
    } else {
      document.title = "Qirox Studio";
    }
  }, [pendingAdminCount, user]);

  useEffect(() => {
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    // Set initial direction
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, [language]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const isDashboard = location.startsWith('/dashboard') || location.startsWith('/admin');

  if (isDashboard) {
    return <main className="min-h-screen bg-[#f8fafc]">{children}</main>;
  }

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md safe-top h-16 md:h-20">
        <div className="container flex h-full items-center justify-between gap-2 px-4 md:gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden no-default-hover-elevate h-10 w-10">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side={language === 'ar' ? "right" : "left"} className="w-full flex flex-col p-0 border-none bg-background overflow-y-auto">
                <div className="flex flex-col h-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>

                  {/* ── Header ─────────────────────────────────── */}
                  <div className="flex items-center justify-between px-5 pt-5 pb-4">
                    <img src={logoImg} alt="Qirox Studio" className="h-9 w-auto object-contain" />
                    <button
                      onClick={closeSidebar}
                      className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors active:scale-95"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>

                  {/* ── User Card ──────────────────────────────── */}
                  {user ? (
                    <div className="mx-4 mb-4 rounded-2xl bg-foreground text-background p-4 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-background/10 flex items-center justify-center text-xl font-black shrink-0">
                        {(user.name || user.username || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm truncate">{user.name || user.username}</p>
                        <p className="text-[11px] opacity-50 truncate">{user.phone || user.email || ""}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[9px] uppercase tracking-widest opacity-50 font-bold">{language === 'ar' ? 'المحفظة' : 'Wallet'}</p>
                        <p className="font-black text-sm text-primary">{(user as any)?.walletBalance?.toLocaleString() || '0'} <span className="text-[10px] opacity-70">{t('currency')}</span></p>
                      </div>
                    </div>
                  ) : (
                    <div className="mx-4 mb-4 rounded-2xl border-2 border-dashed border-border p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-black text-sm">{language === 'ar' ? 'مرحباً بك' : 'Welcome'}</p>
                        <p className="text-[11px] text-muted-foreground">{language === 'ar' ? 'سجّل دخولك لتجربة أفضل' : 'Sign in for a better experience'}</p>
                      </div>
                      <Link href="/login" onClick={closeSidebar}>
                        <button className="h-9 px-4 rounded-xl bg-foreground text-background text-[11px] font-black active:scale-95 transition-transform whitespace-nowrap">
                          {t('signIn')}
                        </button>
                      </Link>
                    </div>
                  )}

                  {/* ── Cart Quick Info ─────────────────────────── */}
                  {cartItems.length > 0 && (
                    <Link href="/cart" onClick={closeSidebar}>
                      <div className="mx-4 mb-4 rounded-2xl bg-primary/5 border border-primary/10 p-3 flex items-center justify-between gap-3 active:scale-98 transition-transform cursor-pointer">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                            <ShoppingBag className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-foreground">{language === 'ar' ? 'السلة' : 'Cart'}</p>
                            <p className="text-[10px] text-muted-foreground">{cartItems.reduce((a, i) => a + i.quantity, 0)} {language === 'ar' ? 'منتجات' : 'items'}</p>
                          </div>
                        </div>
                        <ChevronRight className={`h-4 w-4 text-muted-foreground ${language === 'ar' ? 'rotate-180' : ''}`} />
                      </div>
                    </Link>
                  )}

                  {/* ── Main Navigation ─────────────────────────── */}
                  <div className="px-4 mb-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1 mb-2">{language === 'ar' ? 'القائمة الرئيسية' : 'Navigation'}</p>
                    <div className="space-y-1">
                      {[
                        { href: "/", icon: Home, label: t('home') },
                        { href: "/products", icon: Tag, label: t('shop') },
                        ...(user ? [{ href: "/orders", icon: Package, label: t('myOrders') }] : []),
                        ...(user?.role === 'admin' ? [{ href: "/admin", icon: LayoutDashboard, label: t('adminPanel'), accent: true, badge: pendingAdminCount }] : []),
                      ].map(({ href, icon: Icon, label, accent, badge }: any) => {
                        const isActive = location === href || (href !== '/' && location.startsWith(href));
                        return (
                          <Link key={href} href={href} onClick={closeSidebar}>
                            <div className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all active:scale-95 cursor-pointer ${
                              isActive
                                ? 'bg-foreground text-background'
                                : 'hover:bg-muted text-foreground'
                            }`}>
                              <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isActive ? 'bg-background/10' : accent ? 'bg-primary/10' : 'bg-muted'
                              }`}>
                                <Icon className={`h-4 w-4 ${accent && !isActive ? 'text-primary' : ''}`} />
                                {badge > 0 && (
                                  <span className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse">
                                    {badge > 9 ? "9+" : badge}
                                  </span>
                                )}
                              </div>
                              <span className={`font-bold text-sm flex-1 ${accent && !isActive ? 'text-primary' : ''}`}>{label}</span>
                              {badge > 0 && !isActive && (
                                <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-black rounded-full animate-pulse">
                                  {badge}
                                </span>
                              )}
                              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-background/50" />}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Settings ───────────────────────────────── */}
                  <div className="px-4 mb-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1 mb-2">{language === 'ar' ? 'الإعدادات' : 'Settings'}</p>
                    <div className="space-y-1">
                      <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-all active:scale-95"
                      >
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </div>
                        <span className="font-bold text-sm text-foreground flex-1 text-right">{theme === 'dark' ? (language === 'ar' ? 'الوضع النهاري' : 'Light Mode') : (language === 'ar' ? 'الوضع الليلي' : 'Dark Mode')}</span>
                        <div className={`w-9 h-5 rounded-full transition-colors ${theme === 'dark' ? 'bg-foreground' : 'bg-muted-foreground/30'} relative`}>
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-background transition-all ${theme === 'dark' ? (language === 'ar' ? 'right-0.5' : 'left-4') : (language === 'ar' ? 'right-4' : 'left-0.5')}`} />
                        </div>
                      </button>
                      <button
                        onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-all active:scale-95"
                      >
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Globe className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-sm text-foreground flex-1 text-right">{language === 'ar' ? 'English' : 'العربية'}</span>
                        <span className="text-[10px] font-black px-2 py-1 rounded-full bg-muted text-muted-foreground">{language === 'ar' ? 'EN' : 'AR'}</span>
                      </button>
                    </div>
                  </div>

                  {/* ── More Links ─────────────────────────────── */}
                  <div className="px-4 mb-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1 mb-2">{language === 'ar' ? 'المزيد' : 'More'}</p>
                    <div className="space-y-1">
                      <Link href="/terms" onClick={closeSidebar}>
                        <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-all active:scale-95 cursor-pointer">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0"><Shield className="h-4 w-4" /></div>
                          <span className="font-bold text-sm text-foreground flex-1">{t('terms')}</span>
                          <ChevronRight className={`h-4 w-4 text-muted-foreground ${language === 'ar' ? 'rotate-180' : ''}`} />
                        </div>
                      </Link>
                      <a href="https://api.whatsapp.com/send?phone=966554656670" target="_blank" rel="noreferrer" onClick={closeSidebar}>
                        <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-all active:scale-95 cursor-pointer">
                          <div className="w-8 h-8 rounded-lg bg-[#25D366]/10 flex items-center justify-center shrink-0"><SiWhatsapp className="h-4 w-4 text-[#25D366]" /></div>
                          <span className="font-bold text-sm text-foreground flex-1">{language === 'ar' ? 'تواصل معنا' : 'Contact Us'}</span>
                          <ChevronRight className={`h-4 w-4 text-muted-foreground ${language === 'ar' ? 'rotate-180' : ''}`} />
                        </div>
                      </a>
                      {deferredPrompt && (
                        <button onClick={() => { handleInstall(); closeSidebar(); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-all active:scale-95">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Download className="h-4 w-4 text-primary" /></div>
                          <span className="font-bold text-sm text-foreground flex-1 text-right">{t('installApp')}</span>
                          <span className="text-[9px] font-black px-2 py-1 rounded-full bg-primary text-primary-foreground">{language === 'ar' ? 'جديد' : 'NEW'}</span>
                        </button>
                      )}
                      {user && (
                        <button onClick={() => { logout(); closeSidebar(); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-all active:scale-95">
                          <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center shrink-0"><LogOut className="h-4 w-4 text-red-500" /></div>
                          <span className="font-bold text-sm text-red-500 flex-1 text-right">{t('signOut')}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── Social ─────────────────────────────────── */}
                  <div className="px-4 mt-auto pt-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1 mb-3">{t('connectWithUs')}</p>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[
                        { href: "https://www.instagram.com/qiroxstudio.sa?igsh=MTJ3dXdheG84NGsxbg==", icon: Instagram, bg: "bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888]", label: "IG" },
                        { href: "https://x.com/qiroxstudiosa?s=21", icon: SiX, bg: "bg-black dark:bg-white", labelColor: "text-white dark:text-black", label: "X" },
                        { href: "https://www.tiktok.com/@qiroxstudio.sa?_r=1&_t=ZS-94TeceDRDgy", icon: SiTiktok, bg: "bg-black dark:bg-white", labelColor: "text-white dark:text-black", label: "TK" },
                        { href: "https://snapchat.com/t/ggER0CRB", icon: SiSnapchat, bg: "bg-[#FFFC00]", labelColor: "text-black", label: "SC" },
                      ].map(({ href, icon: Icon, bg, labelColor, label }) => (
                        <a key={label} href={href} target="_blank" rel="noreferrer"
                          className={`flex flex-col items-center gap-1.5 py-3 rounded-xl ${bg} text-white hover:scale-105 active:scale-95 transition-transform shadow-sm`}
                        >
                          <Icon className={`h-5 w-5 ${labelColor || 'text-white'}`} />
                          <span className={`text-[9px] font-black ${labelColor || 'text-white'}`}>{label}</span>
                        </a>
                      ))}
                    </div>

                    {/* Contact row */}
                    <div className="flex gap-2 mb-5">
                      <a href="tel:+966554656670" className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted hover:bg-muted/80 transition-colors active:scale-95">
                        <Phone className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <p className="text-[9px] text-muted-foreground font-bold">{language === 'ar' ? 'اتصل' : 'Call'}</p>
                          <p className="text-[10px] font-black" dir="ltr">966 55 465 6670</p>
                        </div>
                      </a>
                      <a href="mailto:qiroxsystem@gmail.com" className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted hover:bg-muted/80 transition-colors active:scale-95">
                        <Mail className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <p className="text-[9px] text-muted-foreground font-bold">{language === 'ar' ? 'إيميل' : 'Email'}</p>
                          <p className="text-[10px] font-black truncate">qiroxsystem</p>
                        </div>
                      </a>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-border pt-4 pb-8 text-center">
                      <p className="text-[10px] text-muted-foreground font-bold">© 2026 Qirox Studio</p>
                      <p className="text-[9px] text-muted-foreground/50 mt-0.5">e-commerce.qiroxstudio.online</p>
                    </div>
                  </div>

                </div>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center py-1 hover:opacity-80 transition-opacity active:scale-95 transition-transform">
              <img src={logoImg} alt="Qirox Studio" className="h-11 md:h-14 w-auto object-contain rounded-sm" />
            </Link>
          </div>

          <div className={`hidden md:flex items-center gap-8 text-[11px] font-black uppercase ${language === 'en' ? 'tracking-widest' : ''}`}>
            <Link href="/" className={`transition-colors hover:text-primary ${location === '/' ? 'text-foreground' : 'text-muted-foreground'}`}>{t('home')}</Link>
            <Link href="/products" className={`transition-colors hover:text-primary ${location === '/products' ? 'text-foreground' : 'text-muted-foreground'}`}>{t('shop')}</Link>
            {deferredPrompt && (
              <Button 
                onClick={handleInstall}
                variant="ghost"
                size="sm"
                className="gap-2 font-black uppercase text-[10px] h-9"
              >
                <Download className="h-4 w-4" />
                {t('installApp')}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="no-default-hover-elevate hover:text-primary h-11 w-11 active:scale-95 transition-transform"
              title={theme === 'dark' ? 'وضع نهاري' : 'وضع ليلي'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="no-default-hover-elevate hover:text-primary h-11 w-11 active:scale-95 transition-transform"
            >
              <Globe className="h-6 w-6" />
            </Button>

            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative no-default-hover-elevate hover:text-primary h-11 w-11 active:scale-95 transition-transform">
                <ShoppingBag className="h-6 w-6" />
                {cartItems.reduce((acc, item) => acc + item.quantity, 0) > 0 && (
                  <span className={`absolute -top-1 ${language === 'ar' ? '-right-1' : '-left-1'} h-5 w-5 rounded-full bg-foreground text-[10px] font-black text-background flex items-center justify-center shadow-md`}>
                    {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                  </span>
                )}
              </Button>
            </Link>

            {user && <NotificationBell />}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-11 px-2 md:px-4 flex items-center gap-2 md:gap-3 border border-border hover:border-foreground/20 transition-all rounded-none group no-default-hover-elevate active:scale-95">
                    <div className="hidden xs:flex flex-col items-end">
                      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">{t('myAccount') || 'حسابي'}</span>
                      <span className="text-[10px] md:text-[11px] font-bold text-foreground/60 truncate max-w-[80px] md:max-w-[100px]">{user?.name || user?.username}</span>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-all duration-500 shadow-inner">
                      <User className="h-5 w-5" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={language === 'ar' ? "end" : "start"} className="w-64 p-2 rounded-none border-border shadow-2xl bg-background animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-3 py-4 mb-2 bg-muted flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center font-black text-xl">
                      {(user?.name || user?.username || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('welcome') || 'مرحباً بك'}</span>
                      <span className="text-sm font-bold text-foreground truncate max-w-[140px]">{user?.name || user?.username}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Link href="/profile">
                      <DropdownMenuItem className={`cursor-pointer gap-3 p-3 text-[10px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-all rounded-none ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                        <User className="h-4 w-4 opacity-40" />
                        {t('myAccount') || 'حسابي'}
                      </DropdownMenuItem>
                    </Link>
                    
                    <div className={`flex items-center justify-between p-3 mb-2 bg-primary/5 border border-primary/10 rounded-none ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                        <Wallet className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('wallet') || 'المحفظة'}</span>
                      </div>
                      <span dir="ltr" className="text-sm font-black text-primary">{(user as any)?.walletBalance?.toLocaleString() || '0'} {t('currency')}</span>
                    </div>

                    <Link href="/orders">
                      <DropdownMenuItem className={`cursor-pointer gap-3 p-3 text-[10px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-all rounded-none ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                        <ShoppingBag className="h-4 w-4 opacity-40" />
                        {t('myOrders') || 'طلباتي'}
                      </DropdownMenuItem>
                    </Link>

                    <Link href="/profile/wishlist">
                      <DropdownMenuItem className={`cursor-pointer gap-3 p-3 text-[10px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-all rounded-none ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                        <Heart className="h-4 w-4 opacity-40" />
                        {language === 'ar' ? 'قائمة الأمنيات' : 'Wishlist'}
                      </DropdownMenuItem>
                    </Link>
                    
                    {user?.role === 'admin' && (
                      <Link href="/admin">
                        <DropdownMenuItem className={`cursor-pointer gap-3 p-3 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-foreground hover:text-background transition-all rounded-none ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                          <LayoutDashboard className="h-4 w-4" />
                          <span className="flex-1">{t('adminPanel')}</span>
                          {pendingAdminCount > 0 && (
                            <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-black rounded-full animate-pulse">
                              {pendingAdminCount}
                            </span>
                          )}
                        </DropdownMenuItem>
                      </Link>
                    )}
                    
                    <DropdownMenuSeparator className="my-2 bg-border" />
                    
                    <DropdownMenuItem onClick={() => logout()} className={`cursor-pointer gap-3 p-3 text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive hover:text-white transition-all rounded-none ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <User className="h-4 w-4 opacity-40" />
                      {t('signOut')}
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm" className={`font-black uppercase text-[10px] ${language === 'en' ? 'tracking-widest' : ''} h-9 px-4`}>
                  {t('signIn')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      {/* Floating WhatsApp Button */}
      <a
        href="https://api.whatsapp.com/send?phone=966554656670"
        target="_blank"
        rel="noreferrer"
        className={`fixed bottom-6 ${language === 'ar' ? 'right-6' : 'left-6'} z-50 flex items-center gap-2 bg-[#25D366] text-white px-4 py-3 rounded-full shadow-lg hover:scale-110 transition-transform group`}
      >
        <span className="font-bold whitespace-nowrap overflow-hidden max-w-0 group-hover:max-w-xs transition-all duration-500">{t('contactUs')}</span>
        <SiWhatsapp className="h-6 w-6" />
      </a>

      {/* Footer */}
      <footer className="border-t bg-card py-16 mt-24">
        <div className="container grid grid-cols-1 md:grid-cols-4 gap-12 px-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center">
              <img src={logoImg} alt="Qirox Studio" className="h-14 w-auto object-contain" />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {language === 'ar' 
                ? "بناء الأنظمة بلمسة إنسانية. جودة استثنائية وتجربة تسوق لا مثيل لها."
                : "Build systems. Stay human. Exceptional quality and an unrivaled shopping experience."}
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-6">{t('categories')}</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/products" className="hover:text-primary transition-colors">{t('allProducts')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-6">{t('help')}</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/terms" className="hover:text-primary transition-colors">{t('terms')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-6">{t('contactUs')}</h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <a 
                href="tel:+966554656670" 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-primary/5 hover:text-primary transition-all group"
              >
                <span className="bg-primary/10 p-2.5 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors"><Phone className="h-4 w-4" /></span>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-medium">{t('callUs')}</span>
                  <span dir="ltr" className="font-bold">966 55 465 6670</span>
                </div>
              </a>
              <a 
                href="mailto:qiroxsystem@gmail.com" 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-primary/5 hover:text-primary transition-all group"
              >
                <span className="bg-primary/10 p-2.5 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors"><Mail className="h-4 w-4" /></span>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-medium">{t('email')}</span>
                  <span dir="ltr" className="font-bold">qiroxsystem@gmail.com</span>
                </div>
              </a>
              <div className="flex items-center gap-3 p-2">
                <span className="bg-primary/10 p-2.5 rounded-lg text-primary"><SiWhatsapp className="h-4 w-4" /></span>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-medium">{t('whatsapp')}</span>
                  <a href="https://api.whatsapp.com/send?phone=966554656670" target="_blank" rel="noreferrer" dir="ltr" className="font-bold hover:text-primary transition-colors">966 55 465 6670</a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="container mt-16 pt-8 border-t text-center text-sm text-muted-foreground px-4">
          <div className="flex justify-center flex-wrap gap-4 mt-8">
            <a href="https://www.instagram.com/qiroxstudio.sa?igsh=MTJ3dXdheG84NGsxbg==" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white rounded-full hover:scale-105 transition-transform shadow-lg">
              <Instagram className="h-4 w-4" />
              <span className="font-bold">Instagram</span>
            </a>
            <a href="https://x.com/qiroxstudiosa?s=21" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full hover:scale-105 transition-transform shadow-lg border border-white/10">
              <SiX className="h-4 w-4" />
              <span className="font-bold">X</span>
            </a>
            <a href="https://snapchat.com/t/ggER0CRB" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#FFFC00] text-black rounded-full hover:scale-105 transition-transform shadow-lg">
              <SiSnapchat className="h-4 w-4" />
              <span className="font-bold">Snapchat</span>
            </a>
            <a href="https://www.tiktok.com/@qiroxstudio.sa?_r=1&_t=ZS-94TeceDRDgy" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full hover:scale-105 transition-transform shadow-lg border border-white/10">
              <SiTiktok className="h-4 w-4" />
              <span className="font-bold">TikTok</span>
            </a>
            <a href="https://www.linkedin.com/company/qirox-studio/" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#0077B5] text-white rounded-full hover:scale-105 transition-transform shadow-lg">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              <span className="font-bold">LinkedIn</span>
            </a>
          </div>

          {/* Payment Methods Section */}
          <div className="mt-12 pt-8 border-t">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5">{language === 'ar' ? 'طرق الدفع المتاحة' : 'Available Payment Methods'}</p>
            <div className="flex flex-wrap justify-center items-center gap-3">
              {/* Card Brands: Mada + Visa + Mastercard + Amex combined */}
              <div className="h-10 px-2 rounded-xl bg-white border border-gray-100 dark:bg-gray-800 dark:border-gray-700 flex items-center hover:scale-105 transition-transform shadow-sm cursor-default" title="Mada / Visa / Mastercard / Amex">
                <img src="/uploads/card-brands-logo.png" alt="Card Brands" className="h-7 w-auto object-contain" />
              </div>
              {/* Apple Pay */}
              <div className="h-10 px-4 rounded-xl bg-[#1c1c1e] flex items-center gap-1.5 hover:scale-105 transition-transform shadow-sm cursor-default" title="Apple Pay">
                <svg viewBox="0 0 20 24" className="h-4 w-auto fill-white flex-shrink-0">
                  <path d="M13.23 3.02C14.28 1.71 14.94 0 14.94 0s-1.71.28-2.76 1.59c-.96 1.21-1.57 2.86-1.47 3.64.97.07 2.53-.3 3.52-2.21zM16.44 8.74c-1.77-.07-3.28 1-4.13 1-.85 0-2.14-.94-3.55-.91-1.82.03-3.5 1.06-4.43 2.71-1.9 3.28-.49 8.15 1.35 10.82.9 1.31 1.97 2.77 3.38 2.72 1.35-.05 1.86-.87 3.49-.87 1.62 0 2.09.87 3.51.84 1.46-.03 2.39-1.32 3.29-2.63.97-1.47 1.37-2.9 1.4-2.97-.03-.01-2.71-1.04-2.74-4.13-.03-2.59 2.11-3.83 2.21-3.9-1.2-1.78-3.08-1.68-3.78-1.68z"/>
                </svg>
                <span className="text-white font-semibold text-sm">Pay</span>
              </div>
              {/* STC Pay */}
              <div className="h-10 px-2 rounded-xl bg-white border border-gray-100 dark:bg-gray-800 dark:border-gray-700 flex items-center hover:scale-105 transition-transform shadow-sm cursor-default" title="STC Pay">
                <img src="/uploads/stcpay-logo.png" alt="STC Pay" className="h-7 w-auto object-contain" />
              </div>
              {/* Tabby */}
              <div className="h-10 px-2 rounded-xl bg-white border border-gray-100 dark:bg-gray-800 dark:border-gray-700 flex items-center hover:scale-105 transition-transform shadow-sm cursor-default" title="Tabby">
                <img src="/uploads/tabby-logo.png" alt="Tabby" className="h-7 w-auto object-contain" />
              </div>
              {/* Tamara */}
              <div className="h-10 px-2 rounded-xl bg-white border border-gray-100 dark:bg-gray-800 dark:border-gray-700 flex items-center hover:scale-105 transition-transform shadow-sm cursor-default" title="Tamara">
                <img src="/uploads/tamara-logo.png" alt="Tamara" className="h-7 w-auto object-contain" />
              </div>
            </div>
          </div>

          {/* Saudi Business Center Certification */}
          <div className="mt-12 pt-8 border-t flex justify-center">
            <div className="flex flex-col items-center gap-2 text-center">
              <img 
                src="https://assets.zid.store/themes/f9f0914d-3c58-493b-bd83-260ed3cb4e82/business_center.png" 
                loading="lazy" 
                alt="Saudi Business Center Certification" 
                className="h-12 w-auto object-contain" 
              />
              <div className="text-xs text-muted-foreground font-semibold">0000203202</div>
            </div>
          </div>

          {/* Copyright - Last Section */}
          <div className="mt-12 pt-8 border-t">
            <p>© 2026 Qirox Studio. {t('allRightsReserved')}.</p>
            <p className="mt-2 text-xs opacity-70">
              <a
                href="https://qiroxstudio.online"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-100 transition-opacity underline underline-offset-2"
              >
                {t('madeWithLove')}
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
