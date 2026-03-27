import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useLanguage } from "@/hooks/use-language";
import { AuthProvider } from "@/components/auth-provider";
import { SplashScreen } from "@/components/SplashScreen";
import { useState, Component, ReactNode } from "react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetails from "@/pages/ProductDetails";
import Cart from "@/pages/Cart";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ProfileInvoices from "@/pages/ProfileInvoices";
import Admin from "@/pages/Admin";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import Terms from "@/pages/Terms";
import ForgotPassword from "@/pages/ForgotPassword";
import Checkout from "@/pages/Checkout";
import PaymentGateway from "@/pages/PaymentGateway";
import TamaraCheckout from "@/pages/TamaraCheckout";
import TabbyCheckout from "@/pages/TabbyCheckout";
import STCCheckout from "@/pages/STCCheckout";
import Profile from "@/pages/Profile";
import AdminBranches from "@/pages/AdminBranches";
import AdminBranchInventory from "@/pages/AdminBranchInventory";
import AdminStaff from "@/pages/AdminStaff";
import AdminBanners from "@/pages/AdminBanners";
import AdminAuditLogs from "@/pages/AdminAuditLogs";
import AdminRoles from "@/pages/AdminRoles";
import AdminShippingCompanies from "@/pages/AdminShippingCompanies";
import ProfileWishlist from "@/pages/ProfileWishlist";
import POS from "@/pages/POS";
import VendorApply from "@/pages/VendorApply";
import VendorDashboard from "@/pages/VendorDashboard";
import VendorStore from "@/pages/VendorStore";
import VendorsList from "@/pages/VendorsList";
import CashDrawer from "@/pages/CashDrawer";
import CashDrawerReport from "@/pages/CashDrawerReport";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { PWAPrompt } from "@/components/PWAPrompt";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: any) {
    console.error("[ErrorBoundary]", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-8 text-center" dir="rtl">
          <h2 className="text-xl font-bold mb-3 text-slate-800">حدث خطأ غير متوقع</h2>
          <p className="text-slate-500 text-sm mb-6">يرجى إعادة تحميل الصفحة</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="px-6 py-2 bg-black text-white text-sm font-bold rounded-none hover:bg-slate-800 transition-colors"
          >
            إعادة التحميل
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ component: Component, permission }: { component: React.ComponentType, permission?: string }) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>;
  if (!user) {
    const redirect = encodeURIComponent(location);
    return <Redirect to={`/login?redirect=${redirect}`} />;
  }

  if (permission && user.role !== "admin" && (!user.permissions || !user.permissions.includes(permission))) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-8 text-center" dir="rtl">
        <h2 className="text-2xl font-bold mb-4">عذراً، ليس لديك صلاحية للوصول لهذه الصفحة</h2>
        <p className="text-muted-foreground">يرجى التواصل مع الإدارة إذا كنت تعتقد أن هذا خطأ.</p>
      </div>
    );
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/products/:id" component={ProductDetails} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route path="/profile/wishlist">
        <ProtectedRoute component={ProfileWishlist} />
      </Route>
      <Route path="/profile/invoices">
        <ProtectedRoute component={ProfileInvoices} />
      </Route>
      <Route path="/orders">
        <ProtectedRoute component={Orders} />
      </Route>
      <Route path="/orders/:id">
        <ProtectedRoute component={OrderDetail} />
      </Route>
      <Route path="/employees">
        <ProtectedRoute component={Employees} permission="staff.manage" />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>

      {/* Admin Section */}
      <Route path="/admin">
        <ProtectedRoute component={Admin} />
      </Route>
      <Route path="/admin/branches">
        <ProtectedRoute component={AdminBranches} permission="settings.manage" />
      </Route>
      <Route path="/admin/staff">
        <ProtectedRoute component={AdminStaff} permission="staff.manage" />
      </Route>
      <Route path="/admin/banners">
        <ProtectedRoute component={AdminBanners} permission="settings.manage" />
      </Route>
      <Route path="/admin/audit-logs">
        <ProtectedRoute component={AdminAuditLogs} permission="staff.manage" />
      </Route>
      <Route path="/admin/roles">
        <ProtectedRoute component={AdminRoles} permission="staff.manage" />
      </Route>
      <Route path="/admin/inventory">
        <ProtectedRoute component={AdminBranchInventory} permission="settings.manage" />
      </Route>
      <Route path="/admin/shipping">
        <ProtectedRoute component={AdminShippingCompanies} permission="settings.manage" />
      </Route>

      <Route path="/pos">
        <ProtectedRoute component={POS} permission="pos.access" />
      </Route>
      <Route path="/cash-drawer">
        <ProtectedRoute component={CashDrawer} permission="pos.access" />
      </Route>
      <Route path="/cash-report">
        <ProtectedRoute component={CashDrawerReport} permission="reports.view" />
      </Route>
      <Route path="/payment/gateway" component={PaymentGateway} />
      <Route path="/payment/tamara-checkout" component={TamaraCheckout} />
      <Route path="/payment/tabby-checkout" component={TabbyCheckout} />
      <Route path="/payment/stc-checkout" component={STCCheckout} />
      <Route path="/terms" component={Terms} />
      <Route path="/stores" component={VendorsList} />
      <Route path="/stores/:id" component={VendorStore} />
      <Route path="/vendor/apply">
        <ProtectedRoute component={VendorApply} />
      </Route>
      <Route path="/vendor/dashboard">
        <ProtectedRoute component={VendorDashboard} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { language } = useLanguage();

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} lang={language}>
      <ErrorBoundary>
        <Router />
        <PWAPrompt />
      </ErrorBoundary>
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    const seen = sessionStorage.getItem("qirox_splash_seen");
    return !seen;
  });

  const handleSplashFinish = () => {
    sessionStorage.setItem("qirox_splash_seen", "1");
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="qirox-theme">
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            {showSplash ? (
              <SplashScreen onFinish={handleSplashFinish} />
            ) : (
              <AppContent />
            )}
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
