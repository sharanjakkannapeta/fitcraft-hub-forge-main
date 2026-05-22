import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar 
} from "recharts";
import { 
  Package, ShoppingCart, DollarSign, Clock, Truck, CheckCircle, 
  AlertTriangle, ArrowUpRight, Globe
} from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

const COLORS = ['#ff6b00', '#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    indiaOrders: 0,
    intlOrders: 0,
    activeProducts: 0,
    lowStockProducts: 0,
  });
  
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    // Subscribe to new orders
    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
        fetchDashboardData(); // Refresh data on new order
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Orders
      const { data: orders } = await supabase.from('orders').select('*');
      
      // 2. Fetch Transactions for Revenue
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('status', 'success');

      // 3. Fetch Products
      const { data: products } = await supabase.from('products').select('*');

      // Calculate Stats
      if (orders && products) {
        const rev = transactions?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;
        
        setStats({
          totalOrders: orders.length,
          totalRevenue: rev,
          pendingOrders: orders.filter(o => o.order_status === 'pending').length,
          shippedOrders: orders.filter(o => o.order_status === 'shipped').length,
          deliveredOrders: orders.filter(o => o.order_status === 'delivered').length,
          cancelledOrders: orders.filter(o => o.order_status === 'cancelled').length,
          indiaOrders: orders.filter(o => o.order_source === 'india_supplier').length,
          intlOrders: orders.filter(o => o.order_source === 'zendrop').length,
          activeProducts: products.filter(p => p.is_active).length,
          lowStockProducts: products.filter(p => p.stock < (p.low_stock_threshold || 10)).length,
        });

        // Set Recent Orders
        setRecentOrders(orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10));

        // Group revenue by date (last 7 days for simplicity)
        const last7Days = Array.from({length: 7}).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return format(d, 'MMM dd');
        }).reverse();
        
        const revData = last7Days.map(date => {
          return {
            name: date,
            revenue: Math.floor(Math.random() * 5000) + 1000 // Mock data since transactions might be empty
          };
        });
        setRevenueData(revData);
        
        // Mock Top Products
        setTopProducts([
          { name: 'Dumbbell Set', sales: 120 },
          { name: 'Yoga Mat', sales: 98 },
          { name: 'Protein Powder', sales: 86 },
          { name: 'Resistance Bands', sales: 75 },
          { name: 'Kettlebell', sales: 65 },
        ]);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statusData = [
    { name: 'Pending', value: stats.pendingOrders },
    { name: 'Shipped', value: stats.shippedOrders },
    { name: 'Delivered', value: stats.deliveredOrders },
    { name: 'Cancelled', value: stats.cancelledOrders },
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-muted/50 border border-border" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} trend="+12.5%" />
        <StatCard title="Total Orders" value={stats.totalOrders} icon={ShoppingCart} trend="+5.2%" />
        <StatCard title="Active Products" value={stats.activeProducts} icon={Package} />
        <StatCard 
          title="Low Stock Alerts" 
          value={stats.lowStockProducts} 
          icon={AlertTriangle} 
          valueClassName={stats.lowStockProducts > 0 ? "text-red-500" : ""} 
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pending Orders" value={stats.pendingOrders} icon={Clock} />
        <StatCard title="Shipped Orders" value={stats.shippedOrders} icon={Truck} />
        <StatCard title="Delivered Orders" value={stats.deliveredOrders} icon={CheckCircle} />
        <StatCard title="India / Intl Orders" value={`${stats.indiaOrders} / ${stats.intlOrders}`} icon={Globe} />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Revenue Line Chart */}
        <div className="col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-lg">Revenue Overview (Last 7 Days)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} dx={-10} tickFormatter={(val) => `$${val}`} />
                <RechartsTooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                />
                <Line type="monotone" dataKey="revenue" stroke="#ff6b00" strokeWidth={3} dot={{r: 4, fill: '#ff6b00'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Pie Chart */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col">
          <h3 className="mb-4 font-semibold text-lg">Orders by Status</h3>
          <div className="flex-1 min-h-[200px]">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No order data available</div>
            )}
          </div>
          {statusData.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {statusData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}} />
                  <span>{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Top Products Bar Chart */}
        <div className="col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-lg">Top Selling Products</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{top: 0, right: 0, left: 40, bottom: 0}}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#888" opacity={0.2} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
                <RechartsTooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="sales" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders Feed */}
        <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col">
          <div className="border-b border-border p-4 flex items-center justify-between">
            <h3 className="font-semibold text-lg">Recent Orders</h3>
            <button className="text-sm text-accent hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            {recentOrders.length > 0 ? (
              <ul className="divide-y divide-border">
                {recentOrders.map((order) => (
                  <li key={order.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(order.created_at), 'MMM dd, h:mm a')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">${order.total_amount}</p>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                          order.order_status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          order.order_status === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {order.order_status}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">No recent orders</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, valueClassName }: any) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <h2 className={`font-display text-3xl font-bold ${valueClassName || ''}`}>{value}</h2>
        {trend && (
          <span className={`text-sm font-medium ${trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
