import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  CreditCard, DollarSign, Download, ArrowUpRight, TrendingUp, Search
} from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/payments")({
  component: PaymentsManagement,
});

function PaymentsManagement() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    successfulPayments: 0,
    failedPayments: 0,
    refundedPayments: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          orders (order_number, total_amount, customers(name))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const txs = data || [];
      setTransactions(txs);
      
      // Calculate summary
      setSummary({
        totalRevenue: txs.filter(t => t.status === 'success').reduce((sum, t) => sum + Number(t.amount || 0), 0),
        successfulPayments: txs.filter(t => t.status === 'success').length,
        failedPayments: txs.filter(t => t.status === 'failed').length,
        refundedPayments: txs.filter(t => t.status === 'refunded').length,
      });
      
    } catch (error: any) {
      toast.error("Failed to load transactions: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!transactions.length) return;
    
    const headers = ['Transaction ID', 'Order #', 'Date', 'Amount', 'Currency', 'Method', 'Gateway', 'Status'];
    const csvData = transactions.map(t => [
      t.transaction_id || t.id,
      t.orders?.order_number || 'N/A',
      new Date(t.created_at).toLocaleString(),
      t.amount,
      t.currency,
      t.payment_method,
      t.payment_gateway,
      t.status
    ]);
    
    const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_export_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTransactions = transactions.filter(t => 
    t.transaction_id?.toLowerCase().includes(search.toLowerCase()) || 
    t.orders?.order_number?.toLowerCase().includes(search.toLowerCase()) ||
    t.payment_method?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold">Payments & Revenue</h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 rounded-md bg-white border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors dark:bg-card"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="font-display text-3xl font-bold">${summary.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
          </div>
        </div>
        
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Successful Payments</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="font-display text-3xl font-bold">{summary.successfulPayments}</h2>
          </div>
        </div>
        
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Failed Payments</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="font-display text-3xl font-bold">{summary.failedPayments}</h2>
          </div>
        </div>
        
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Refunded</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="font-display text-3xl font-bold">{summary.refundedPayments}</h2>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by transaction ID or order number..." 
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
                <th className="px-6 py-3 font-medium">Transaction</th>
                <th className="px-6 py-3 font-medium">Order</th>
                <th className="px-6 py-3 font-medium">Method</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{tx.transaction_id || tx.id.slice(0, 8)}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{tx.payment_gateway}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{tx.orders?.order_number || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{tx.orders?.customers?.name || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="uppercase">{tx.payment_method}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {tx.currency === 'INR' ? '₹' : '$'}{tx.amount}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider
                        ${tx.status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                          tx.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          tx.status === 'refunded' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}
                      `}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground">
                      {format(new Date(tx.created_at), 'MMM dd, yyyy h:mm a')}
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
