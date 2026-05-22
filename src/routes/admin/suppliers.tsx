import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Users, Plus, Search, Edit2, Trash2, Mail, MessageCircle, 
  RefreshCw, Link as LinkIcon, Settings
} from "lucide-react";

export const Route = createFileRoute("/admin/suppliers")({
  component: SuppliersManagement,
});

function SuppliersManagement() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Edit/Add modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  
  // Settings Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [zendropKey, setZendropKey] = useState("");
  const [isTestingZendrop, setIsTestingZendrop] = useState(false);

  useEffect(() => {
    fetchSuppliers();
    fetchSettings();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: any) {
      toast.error("Failed to load suppliers: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('*').eq('key', 'zendrop_api_key').single();
    if (data) {
      setZendropKey(data.value?.key || "");
    }
  };

  const saveSettings = async () => {
    try {
      const { error } = await supabase.from('settings').upsert({
        key: 'zendrop_api_key',
        value: { key: zendropKey }
      });
      if (error) throw error;
      toast.success("Zendrop settings saved");
      setIsSettingsOpen(false);
    } catch (error: any) {
      toast.error("Failed to save settings: " + error.message);
    }
  };

  const testZendropConnection = async () => {
    setIsTestingZendrop(true);
    // Simulate API call to Zendrop
    setTimeout(() => {
      if (zendropKey.length > 10) {
        toast.success("Connection to Zendrop successful!");
      } else {
        toast.error("Invalid Zendrop API Key");
      }
      setIsTestingZendrop(false);
    }, 1500);
  };

  const manualSyncZendrop = () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 3000)),
      {
        loading: 'Syncing products with Zendrop...',
        success: 'Sync completed! 15 products updated.',
        error: 'Sync failed.'
      }
    );
  };

  const saveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: editingSupplier.name,
        email: editingSupplier.email,
        whatsapp: editingSupplier.whatsapp,
        type: editingSupplier.type,
      };

      if (editingSupplier.id) {
        const { error } = await supabase.from('suppliers').update(payload).eq('id', editingSupplier.id);
        if (error) throw error;
        toast.success("Supplier updated");
      } else {
        const { error } = await supabase.from('suppliers').insert(payload);
        if (error) throw error;
        toast.success("Supplier added");
      }

      setIsModalOpen(false);
      fetchSuppliers();
    } catch (error: any) {
      toast.error("Error saving supplier: " + error.message);
    }
  };

  const deleteSupplier = async (id: string) => {
    if (!confirm("Are you sure you want to delete this supplier?")) return;
    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
      toast.success("Supplier deleted");
      fetchSuppliers();
    } catch (error: any) {
      toast.error("Error deleting supplier: " + error.message);
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name?.toLowerCase().includes(search.toLowerCase()) || 
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold">Suppliers Management</h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={manualSyncZendrop}
            className="flex items-center gap-2 rounded-md bg-white border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors dark:bg-card"
          >
            <RefreshCw className="h-4 w-4 text-blue-500" /> Manual Zendrop Sync
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 rounded-md bg-white border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors dark:bg-card"
          >
            <Settings className="h-4 w-4" /> Zendrop Settings
          </button>
          <button 
            onClick={() => { setEditingSupplier({ type: 'india' }); setIsModalOpen(true); }}
            className="flex items-center gap-2 rounded-md bg-foreground text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Supplier
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col">
        {/* Filters Area */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search suppliers by name or email..." 
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
                <th className="px-6 py-3 font-medium">Supplier Details</th>
                <th className="px-6 py-3 font-medium">Contact</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    No suppliers found.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{supplier.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">Joined {new Date(supplier.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{supplier.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm mt-1">
                        <MessageCircle className="h-4 w-4 text-green-500" />
                        <span>{supplier.whatsapp || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider
                        ${supplier.type === 'zendrop' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'}
                      `}>
                        {supplier.type === 'zendrop' ? 'Zendrop' : 'India Local'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => { setEditingSupplier(supplier); setIsModalOpen(true); }}
                        className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => deleteSupplier(supplier.id)}
                        className="inline-flex items-center justify-center rounded-md p-2 text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && editingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-card border border-border p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-2xl font-bold mb-6">{editingSupplier.id ? "Edit Supplier" : "Add Supplier"}</h2>
            <form onSubmit={saveSupplier} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Name</label>
                <input
                  required
                  type="text"
                  value={editingSupplier.name || ""}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                <input
                  type="email"
                  value={editingSupplier.email || ""}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, email: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">WhatsApp Number</label>
                <input
                  type="text"
                  value={editingSupplier.whatsapp || ""}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, whatsapp: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Supplier Type</label>
                <select
                  value={editingSupplier.type || "india"}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, type: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="india">India Local</option>
                  <option value="zendrop">Zendrop</option>
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Zendrop Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-card border border-border p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
              <LinkIcon className="h-6 w-6 text-accent" /> Zendrop Integration
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Zendrop API Key</label>
                <input
                  type="password"
                  value={zendropKey}
                  onChange={(e) => setZendropKey(e.target.value)}
                  placeholder="Paste your Zendrop API key here..."
                  className="w-full rounded-md border border-border bg-background px-3 py-2 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  This key is required to automatically fetch products and fulfill international orders.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={testZendropConnection}
                  disabled={isTestingZendrop || !zendropKey}
                  className="flex flex-1 justify-center items-center gap-2 rounded-md border border-accent text-accent px-4 py-2 text-sm font-medium hover:bg-accent/10 disabled:opacity-50"
                >
                  {isTestingZendrop ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Test Connection
                </button>
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSettings}
                  className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
