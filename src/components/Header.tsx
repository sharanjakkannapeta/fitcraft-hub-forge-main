import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, Heart, User, LogOut, Search, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const nav = useNavigate();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) { setCount(0); return; }
    const load = async () => {
      const { data } = await supabase.from("cart_items").select("quantity").eq("user_id", user.id);
      setCount(data?.reduce((s, r) => s + r.quantity, 0) ?? 0);
    };
    load();
    const ch = supabase.channel("cart-c").on("postgres_changes", { event: "*", schema: "public", table: "cart_items", filter: `user_id=eq.${user.id}` }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const links = [
    { to: "/", label: "Home" },
    { to: "/shop", label: "Shop" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-baseline gap-1">
          <span className="font-display text-2xl tracking-wider text-foreground">FIT CRAFT</span>
          <span className="font-display text-2xl tracking-wider text-accent">HUB</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm font-medium uppercase tracking-wide text-muted-foreground transition-smooth hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button onClick={() => nav({ to: "/shop" })} className="hidden h-9 w-9 items-center justify-center rounded-full text-foreground transition-smooth hover:bg-secondary md:inline-flex" aria-label="Search"><Search className="h-4 w-4" /></button>
          {user ? (
            <>
              <Link to="/wishlist" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-smooth hover:bg-secondary"><Heart className="h-4 w-4" /></Link>
              <Link to="/account" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-smooth hover:bg-secondary"><User className="h-4 w-4" /></Link>
              {isAdmin && <Link to="/admin" className="hidden rounded-md border border-border px-3 py-1 text-xs font-medium uppercase tracking-wide transition-smooth hover:bg-secondary md:inline-block">Admin</Link>}
              <button onClick={() => signOut()} className="hidden h-9 w-9 items-center justify-center rounded-full text-foreground transition-smooth hover:bg-secondary md:inline-flex" aria-label="Sign out"><LogOut className="h-4 w-4" /></button>
            </>
          ) : (
            <Link to="/login" className="rounded-md bg-foreground px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-smooth hover:bg-foreground/85">Sign in</Link>
          )}
          <Link to="/cart" className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-smooth hover:bg-secondary">
            <ShoppingBag className="h-4 w-4" />
            {count > 0 && <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">{count}</span>}
          </Link>
          <button onClick={() => setOpen(!open)} className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full md:hidden">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border md:hidden">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-3">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">{l.label}</Link>
            ))}
            {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary">Admin</Link>}
          </nav>
        </div>
      )}
    </header>
  );
}
