import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Tag, Plus, Edit2, Trash2, Search, X, Activity
} from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/coupons")({
  component: CouponsManagement,
});

function CouponsManagement() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Edit/Add modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error: any) {
      toast.error("Failed to load coupons: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...editingCoupon };
      delete payload.id;
      delete payload.created_at;
      delete payload.used_count; // Don't override used_count on edit unless explicitly intended

      if (editingCoupon.id) {
        const { error } = await supabase.from('coupons').update(payload).eq('id', editingCoupon.id);
        if (error) throw error;
        toast.success("Coupon updated");
      } else {
        payload.used_count = 0;
        const { error } = await supabase.from('coupons').insert(payload);
        if (error) throw error;
        toast.success("Coupon added");
      }

      setIsModalOpen(false);
      fetchCoupons();
    } catch (error: any) {
      toast.error("Error saving coupon: " + error.message);
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
      toast.success("Coupon deleted");
      fetchCoupons();
    } catch (error: any) {
      toast.error("Error deleting coupon: " + error.message);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('coupons').update({ is_active: !currentStatus }).eq('id', id);
      if (error) throw error;
      toast.success(`Coupon ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchCoupons();
    } catch (error: any) {
      toast.error("Error toggling status: " + error.message);
    }
  };

  const filteredCoupons = coupons.filter(c => 
    c.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Tag className="h-6 w-6" /> Coupons
        </h1>
        <button 
          onClick={() => { 
            setEditingCoupon({ 
              discount_type: 'percentage', 
              is_active: true,
              usage_limit: 100,
              min_order_value: 0
            }); 
            setIsModalOpen(true); 
          }}
          className="flex items-center gap-2 rounded-md bg-foreground text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Plus className="h-4 w-4" /> Create Coupon
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col">
        {/* Filters */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search coupons by code..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-background pl-9 pr-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Code</th>
                <th className="px-6 py-3 font-medium">Discount</th>
                <th className="px-6 py-3 font-medium">Usage</th>
                <th className="px-6 py-3 font-medium">Expiry</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No coupons found.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => {
                  const isLimitReached = coupon.usage_limit && coupon.used_count >= coupon.usage_limit;
                  const isExpired = coupon.expiry_date && new Date(coupon.expiry_date) < new Date();
                  
                  return (
                    <tr key={coupon.id} className={`hover:bg-muted/30 transition-colors ${!coupon.is_active || isLimitReached || isExpired ? 'opacity-60 bg-muted/20' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-foreground text-lg">{coupon.code}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Min order: ${coupon.min_order_value || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">
                          {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `$${coupon.discount_value} OFF`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">{coupon.used_count}</div>
                          <div className="text-xs text-muted-foreground">/ {coupon.usage_limit || '∞'}</div>
                          {isLimitReached && (
                            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-2">Limit Reached</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {coupon.expiry_date ? format(new Date(coupon.expiry_date), 'MMM dd, yyyy') : 'No Expiry'}
                        </div>
                        {isExpired && (
                          <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Expired</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-1">
                        <button 
                          onClick={() => toggleStatus(coupon.id, coupon.is_active)}
                          className={`inline-flex items-center justify-center rounded-md p-2 transition-colors ${coupon.is_active ? 'text-green-600 hover:bg-green-50' : 'text-muted-foreground hover:bg-muted'}`}
                          title={coupon.is_active ? "Active - Click to disable" : "Disabled - Click to enable"}
                        >
                          <Activity className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => { setEditingCoupon(coupon); setIsModalOpen(true); }}
                          className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => deleteCoupon(coupon.id)}
                          className="inline-flex items-center justify-center rounded-md p-2 text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && editingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl bg-card border border-border shadow-xl my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border p-6">
              <h2 className="font-display text-2xl font-bold">{editingCoupon.id ? "Edit Coupon" : "Create Coupon"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={saveCoupon} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Coupon Code</label>
                <input
                  required
                  type="text"
                  value={editingCoupon.code || ""}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono uppercase focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="e.g. SUMMER20"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Discount Type</label>
                  <select
                    value={editingCoupon.discount_type || "percentage"}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, discount_type: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Discount Value</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingCoupon.discount_value || ""}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, discount_value: parseFloat(e.target.value) })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Min. Order Value ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingCoupon.min_order_value || 0}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, min_order_value: parseFloat(e.target.value) })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={editingCoupon.usage_limit || ""}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, usage_limit: parseInt(e.target.value) || null })}
                    placeholder="Leave empty for unlimited"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={editingCoupon.expiry_date ? new Date(editingCoupon.expiry_date).toISOString().split('T')[0] : ""}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, expiry_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingCoupon.is_active !== false}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                />
                <label htmlFor="isActive" className="text-sm font-medium">Coupon is active</label>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-foreground px-6 py-2 text-sm font-bold uppercase tracking-wider text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {editingCoupon.id ? "Save Changes" : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
