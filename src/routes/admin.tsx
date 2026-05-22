import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  CreditCard, 
  Bell, 
  Mail, 
  Tag, 
  Settings, 
  LogOut,
  Menu,
  X,
  Dumbbell
} from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

const NAV_ITEMS = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Orders", path: "/admin/orders", icon: ShoppingCart },
  { label: "Products", path: "/admin/products", icon: Package },
  { label: "Suppliers", path: "/admin/suppliers", icon: Users },
  { label: "Customers", path: "/admin/customers", icon: Users },
  { label: "Payments", path: "/admin/payments", icon: CreditCard },
  { label: "Notifications", path: "/admin/notifications", icon: Bell },
  { label: "Emails", path: "/admin/emails", icon: Mail },
  { label: "Coupons", path: "/admin/coupons", icon: Tag },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

function AdminLayout() {
  const { user, loading, isAdmin, signOut } = useAuth();
  const nav = useNavigate();
  const routerState = useRouterState();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      nav({ to: "/login" });
    }
  }, [user, loading, nav]);

  useEffect(() => {
    if (isAdmin) {
      const fetchUnread = async () => {
        const { count } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("is_read", false);
        setUnreadCount(count || 0);
      };
      fetchUnread();

      const channel = supabase
        .channel("admin_notifications")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications" },
          (payload) => {
            setUnreadCount((prev) => prev + 1);
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-display text-4xl">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">You do not have admin privileges.</p>
          <button 
            onClick={() => nav({ to: "/" })}
            className="mt-6 rounded-md bg-foreground px-5 py-2.5 text-sm font-semibold text-primary-foreground uppercase tracking-wider"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    nav({ to: "/" });
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#111] text-white transition-transform duration-300 md:static md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-white/10">
          <Link to="/admin" className="flex items-center gap-2 font-display text-xl text-white">
            <Dumbbell className="h-6 w-6 text-[#ff6b00]" />
            FitCraft <span className="text-[#ff6b00]">Admin</span>
          </Link>
          <button className="md:hidden text-white/70" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {NAV_ITEMS.map((item) => {
              const isActive = routerState.location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive 
                        ? "bg-[#ff6b00] text-white" 
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    {item.label === "Notifications" && unreadCount > 0 && (
                      <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] text-white">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="border-t border-white/10 p-4">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden bg-background">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6 text-foreground" />
            </button>
            <h2 className="font-semibold text-lg hidden md:block">
              {NAV_ITEMS.find((i) => i.path === routerState.location.pathname)?.label || "Admin Dashboard"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/admin/notifications" className="relative text-foreground hover:text-accent transition-colors">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">
                  {unreadCount}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden text-sm md:block">
                <p className="font-medium">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#f8f9fa] dark:bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
