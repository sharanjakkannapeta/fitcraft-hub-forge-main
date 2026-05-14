import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Package, ShoppingCart, Tag } from "lucide-react";
import type { Product } from "@/lib/types";

export const Route = createFileRoute("/admin")({ component: Admin });

interface Order { id: string; status: string; total: number; created_at: string; user_id: string | null; tracking_number: string | null }

function Admin() {
  const { user, loading, isAdmin } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState<"products" | "orders" | "coupons">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<{ id: string; code: string; discount_type: string; discount_value: number; active: boolean }[]>([]);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);

  const reload = async () => {
    const [p, o, c] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("id, status, total, created_at, user_id, tracking_number").order("created_at", { ascending: false }),
      supabase.from("coupons").select("id, code, discount_type, discount_value, active"),
    ]);
    setProducts((p.data ?? []) as Product[]);
    setOrders((o.data ?? []) as Order[]);
    setCoupons((c.data ?? []) as typeof coupons);
  };
  useEffect(() => { if (isAdmin) reload(); }, [isAdmin]);

  if (loading) return <div className="container mx-auto px-4 py-20 text-center">Loading…</div>;
  if (!user) { nav({ to: "/login" }); return null; }
  if (!isAdmin) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="font-display text-4xl">Admin access required</h1>
      <p className="mt-2 text-muted-foreground">Your account ID: <code className="rounded bg-secondary px-2 py-0.5 font-mono text-xs">{user.id}</code></p>
      <p className="mt-2 text-sm text-muted-foreground">To grant yourself admin access, ask the assistant to insert your user ID into the user_roles table with role = 'admin'.</p>
    </div>
  );

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const payload = {
      name: editing.name ?? "",
      slug: (editing.slug ?? editing.name ?? "").toString().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      description: editing.description ?? "",
      price: Number(editing.price ?? 0),
      compare_at_price: editing.compare_at_price ? Number(editing.compare_at_price) : null,
      stock: Number(editing.stock ?? 0),
      brand: editing.brand ?? "",
      image_url: editing.image_url ?? "",
      is_featured: !!editing.is_featured,
      is_best_seller: !!editing.is_best_seller,
    };
    const { error } = editing.id
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    if (error) toast.error(error.message); else { toast.success("Saved"); setEditing(null); reload(); }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); reload(); }
  };

  const updateOrder = async (id: string, patch: Record<string, unknown>) => {
    const { error } = await supabase.from("orders").update(patch as never).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Updated"); reload(); }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-display text-5xl">Admin Dashboard</h1>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <Stat icon={Package} label="Products" value={products.length} />
        <Stat icon={ShoppingCart} label="Orders" value={orders.length} />
        <Stat icon={Tag} label="Active Coupons" value={coupons.filter((c) => c.active).length} />
      </div>

      <div className="mt-8 flex gap-1 border-b border-border">
        {(["products", "orders", "coupons"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`border-b-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-smooth ${tab === t ? "border-accent text-foreground" : "border-transparent text-muted-foreground"}`}>{t}</button>
        ))}
      </div>

      {tab === "products" && (
        <div className="mt-6">
          <button onClick={() => setEditing({})} className="mb-4 inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-accent hover:text-accent-foreground"><Plus className="h-4 w-4" /> New product</button>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-xs uppercase tracking-wider">
                <tr><th className="p-3 text-left">Product</th><th className="p-3 text-left">Price</th><th className="p-3 text-left">Stock</th><th className="p-3 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="p-3"><div className="flex items-center gap-3">{p.image_url && <img src={p.image_url} alt="" className="h-10 w-10 rounded object-cover" />}<span className="font-medium">{p.name}</span></div></td>
                    <td className="p-3">${p.price.toFixed(2)}</td>
                    <td className="p-3">{p.stock}</td>
                    <td className="p-3 text-right"><button onClick={() => setEditing(p)} className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded hover:bg-secondary"><Edit2 className="h-4 w-4" /></button><button onClick={() => deleteProduct(p.id)} className="inline-flex h-8 w-8 items-center justify-center rounded text-destructive hover:bg-secondary"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="mt-6 space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
                </div>
                <p className="font-display text-2xl">${o.total.toFixed(2)}</p>
                <select value={o.status} onChange={(e) => updateOrder(o.id, { status: e.target.value })} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs">
                  {["pending", "paid", "processing", "shipped", "delivered", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input placeholder="Tracking #" defaultValue={o.tracking_number ?? ""} onBlur={(e) => e.target.value !== (o.tracking_number ?? "") && updateOrder(o.id, { tracking_number: e.target.value })} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs" />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "coupons" && (
        <div className="mt-6 space-y-2">
          {coupons.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-md border border-border bg-card p-4">
              <div><p className="font-mono font-bold">{c.code}</p><p className="text-xs text-muted-foreground">{c.discount_type === "percent" ? `${c.discount_value}% off` : `$${c.discount_value} off`}</p></div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${c.active ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>{c.active ? "Active" : "Inactive"}</span>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4" onClick={() => setEditing(null)}>
          <form onSubmit={saveProduct} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg space-y-3 rounded-lg bg-background p-6 shadow-elegant">
            <h2 className="font-display text-2xl">{editing.id ? "Edit" : "New"} product</h2>
            <input required placeholder="Name" value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <input placeholder="Slug (auto from name)" value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <textarea placeholder="Description" value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" rows={3} />
            <div className="grid grid-cols-3 gap-2">
              <input required type="number" step="0.01" placeholder="Price" value={editing.price ?? ""} onChange={(e) => setEditing({ ...editing, price: +e.target.value })} className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <input type="number" step="0.01" placeholder="Compare at" value={editing.compare_at_price ?? ""} onChange={(e) => setEditing({ ...editing, compare_at_price: +e.target.value })} className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <input type="number" placeholder="Stock" value={editing.stock ?? ""} onChange={(e) => setEditing({ ...editing, stock: +e.target.value })} className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <input placeholder="Brand" value={editing.brand ?? ""} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <input placeholder="Image URL" value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={!!editing.is_featured} onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })} className="accent-accent" /> Featured</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={!!editing.is_best_seller} onChange={(e) => setEditing({ ...editing, is_best_seller: e.target.checked })} className="accent-accent" /> Best seller</label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-md border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wider">Cancel</button>
              <button className="rounded-md bg-foreground px-5 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-accent hover:text-accent-foreground">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: number }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-5">
      <div className="rounded-md bg-accent/15 p-3 text-accent"><Icon className="h-5 w-5" /></div>
      <div><p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p><p className="font-display text-3xl">{value}</p></div>
    </div>
  );
}
