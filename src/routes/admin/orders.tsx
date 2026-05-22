import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { 
  Search, Filter, Download, Eye, MoreHorizontal, ChevronLeft, ChevronRight,
  ArrowUpDown, Package
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({
  component: OrdersManagement,
});

function OrdersManagement() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const limit = 20;

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [page, search, statusFilter, sourceFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('orders')
        .select(`
          *,
          customers(name, email, phone)
        `, { count: 'exact' });

      if (statusFilter !== 'all') {
        query = query.eq('order_status', statusFilter);
      }
      if (sourceFilter !== 'all') {
        query = query.eq('order_source', sourceFilter);
      }
      if (search) {
        // Simple search by order number for now
        query = query.ilike('order_number', `%${search}%`);
      }

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      setOrders(data || []);
      if (count) {
        setTotalPages(Math.ceil(count / limit));
      }
    } catch (error: any) {
      toast.error("Failed to load orders: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!orders.length) return;
    
    const headers = ['Order ID', 'Date', 'Customer', 'Amount', 'Status', 'Payment', 'Source'];
    const csvData = orders.map(o => [
      o.order_number,
      new Date(o.created_at).toLocaleString(),
      o.customers?.name || 'Unknown',
      o.total_amount,
      o.order_status,
      o.payment_status,
      o.order_source
    ]);
    
    const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_export_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold">Orders Management</h1>
        <button 
          onClick={exportToCSV}
          className="flex items-center gap-2 rounded-md bg-white border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors dark:bg-card"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col">
        {/* Filters Area */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by order number..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-background pl-9 pr-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select 
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="all">All Sources</option>
              <option value="india_supplier">India Supplier</option>
              <option value="zendrop">Zendrop</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Order Details</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Payment</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No orders found matching your filters.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{order.order_number}</div>
                      <div className="text-xs text-muted-foreground mt-1">{format(new Date(order.created_at), 'MMM dd, yyyy h:mm a')}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Package className="h-3 w-3" />
                        {order.order_source === 'zendrop' ? 'Zendrop' : 'India'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{order.customers?.name || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">{order.customers?.email || ''}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {order.currency === 'INR' ? '₹' : '$'}{order.total_amount}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider
                        ${order.order_status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          order.order_status === 'cancelled' || order.order_status === 'refunded' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          order.order_status === 'shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                          order.order_status === 'processing' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                          'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}
                      >
                        {order.order_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider
                        ${order.payment_status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          order.payment_status === 'refunded' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}
                      >
                        {order.payment_status || 'unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* TODO: Add link to order details route */}
                      <Link 
                        to={`/admin/orders/${order.id}`}
                        className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border p-4">
          <div className="text-sm text-muted-foreground">
            Showing Page {page} of {totalPages || 1}
          </div>
          <div className="flex gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="flex items-center justify-center rounded-md border border-border bg-background p-2 disabled:opacity-50 hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button 
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="flex items-center justify-center rounded-md border border-border bg-background p-2 disabled:opacity-50 hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
