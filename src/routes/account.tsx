import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package, User as UserIcon, LogOut } from "lucide-react";

export const Route = createFileRoute("/account")({ component: Account });

interface Order {
  id: string;
  status: string;
  total: number;
  created_at: string;
  tracking_number: string | null;
}

function Account() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string; phone: string }>({
    full_name: "",
    phone: "",
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<"orders" | "profile">("orders");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle()
      .then(
        ({ data }) =>
          data && setProfile({ full_name: data.full_name ?? "", phone: data.phone ?? "" }),
      );
    supabase
      .from("orders")
      .select("id, status, total, created_at, tracking_number")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders((data ?? []) as Order[]));
  }, [user]);

  if (loading) return <div className="container mx-auto px-4 py-20 text-center">Loading…</div>;
  if (!user) {
    nav({ to: "/login" });
    return null;
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("profiles").update(profile).eq("id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-display text-5xl">My Account</h1>
      <p className="mt-1 text-muted-foreground">{user.email}</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-1">
          {[
            { id: "orders", label: "Orders", icon: Package },
            { id: "profile", label: "Profile", icon: UserIcon },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as "orders" | "profile")}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-smooth ${tab === t.id ? "bg-foreground text-primary-foreground" : "hover:bg-secondary"}`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
          <button
            onClick={async () => {
              await signOut();
              nav({ to: "/" });
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </aside>
        <div>
          {tab === "orders" && (
            <div className="space-y-3">
              {orders.length === 0 && (
                <p className="text-muted-foreground">
                  No orders yet.{" "}
                  <Link to="/shop" className="text-accent underline">
                    Start shopping
                  </Link>
                </p>
              )}
              {orders.map((o) => (
                <div key={o.id} className="rounded-lg border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">
                        #{o.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="mt-1 text-sm">{new Date(o.created_at).toLocaleDateString()}</p>
                      {o.tracking_number && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Tracking: <span className="font-mono">{o.tracking_number}</span>
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent">
                        {o.status}
                      </span>
                      <p className="mt-2 font-display text-2xl">${o.total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === "profile" && (
            <form onSubmit={saveProfile} className="rounded-lg border border-border bg-card p-6">
              <div className="space-y-3">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Full name
                  </label>
                  <input
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Phone
                  </label>
                  <input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
              <button className="mt-6 rounded-md bg-foreground px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-accent hover:text-accent-foreground">
                Save
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
