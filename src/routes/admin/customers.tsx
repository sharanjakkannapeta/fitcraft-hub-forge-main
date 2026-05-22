import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Users, Search, ShieldBan, Shield, Download, MapPin, 
  Phone, Mail, ShoppingBag
} from "lucide-react";

export const Route = createFileRoute("/admin/customers")({
  component: CustomersManagement,
});

function CustomersManagement() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      // Fetch customers and their total orders count
      const { data: customersData, error } = await supabase
        .from('customers')
        .select(`
          *,
          orders (id, total_amount)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const processed = customersData?.map(c => ({
        ...c,
        total_orders: c.orders?.length || 0,
        total_spent: c.orders?.reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0) || 0
      })) || [];
      
      setCustomers(processed);
    } catch (error: any) {
      toast.error("Failed to load customers: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleBlockStatus = async (id: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'unblock' : 'block'} this customer?`)) return;
    try {
      const { error } = await supabase
        .from('customers')
        .update({ is_blocked: !currentStatus })
        .eq('id', id);
        
      if (error) throw error;
      toast.success(`Customer ${!currentStatus ? 'blocked' : 'unblocked'} successfully`);
      fetchCustomers();
    } catch (error: any) {
      toast.error("Failed to update status: " + error.message);
    }
  };

  const exportToCSV = () => {
    if (!customers.length) return;
    
    const headers = ['Name', 'Email', 'Phone', 'City', 'Country', 'Total Orders', 'Total Spent', 'Status'];
    const csvData = customers.map(c => [
      c.name || 'N/A',
      c.email || 'N/A',
      c.phone || 'N/A',
      c.city || 'N/A',
      c.country || 'N/A',
      c.total_orders,
      c.total_spent,
      c.is_blocked ? 'Blocked' : 'Active'
    ]);
    
    const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `customers_export_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold">Customers</h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 rounded-md bg-white border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors dark:bg-card"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by name, email, or phone..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-background pl-9 pr-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Customer Details</th>
                <th className="px-6 py-3 font-medium">Location</th>
                <th className="px-6 py-3 font-medium text-center">Orders</th>
                <th className="px-6 py-3 font-medium text-right">Total Spent</th>
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
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className={`hover:bg-muted/30 transition-colors ${customer.is_blocked ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold">
                          {customer.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="font-medium text-foreground flex items-center gap-2">
                            {customer.name || 'Unknown User'}
                            {customer.is_blocked && (
                              <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                Blocked
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {customer.email}</span>
                          </div>
                          {customer.phone && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3" /> {customer.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" /> 
                          {customer.city ? `${customer.city}, ${customer.country}` : 'No address'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-medium">
                      {customer.total_orders}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      ${customer.total_spent.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => toggleBlockStatus(customer.id, customer.is_blocked)}
                        title={customer.is_blocked ? "Unblock Customer" : "Block Customer"}
                        className={`inline-flex items-center justify-center rounded-md p-2 transition-colors ${
                          customer.is_blocked 
                            ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' 
                            : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                        }`}
                      >
                        {customer.is_blocked ? <Shield className="h-4 w-4" /> : <ShieldBan className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
