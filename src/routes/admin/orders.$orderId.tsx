import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { 
  ArrowLeft, Package, Truck, User, MapPin, CreditCard, Clock, FileText, 
  CheckCircle, AlertTriangle, RefreshCcw, Save
} from "lucide-react";

export const Route = createFileRoute("/admin/orders/$orderId")({
  component: OrderDetails,
});

function OrderDetails() {
  const { orderId } = Route.useParams();
  const nav = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit states
  const [isSaving, setIsSaving] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [status, setStatus] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      // Fetch Order with Customer
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          customers(*)
        `)
        .eq('id', orderId)
        .single();
        
      if (orderError) throw orderError;
      
      setOrder(orderData);
      setTrackingNumber(orderData.tracking_number || "");
      setStatus(orderData.order_status);
      setInternalNotes(orderData.internal_notes || "");

      // Fetch Order Items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*, products(name, images)')
        .eq('order_id', orderId);
        
      if (itemsError) throw itemsError;
      setItems(itemsData || []);
      
    } catch (error: any) {
      toast.error("Failed to load order: " + error.message);
      nav({ to: "/admin/orders" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('orders')
        .update({
          tracking_number: trackingNumber,
          order_status: status,
          internal_notes: internalNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
      toast.success("Order updated successfully");
      
      // If status changed to shipped, we could trigger a notification or email here
      if (status === 'shipped' && order.order_status !== 'shipped') {
        // Trigger Edge function or insert into email_logs
      }

      fetchOrder();
    } catch (error: any) {
      toast.error("Update failed: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!order) return null;

  const isDelivered = order.order_status === 'delivered';
  const isCancelled = order.order_status === 'cancelled' || order.order_status === 'refunded';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Link 
          to="/admin/orders"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-3">
            Order {order.order_number}
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium uppercase tracking-wider
              ${isDelivered ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                isCancelled ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
              }`}
            >
              {order.order_status}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Placed on {format(new Date(order.created_at), 'MMMM dd, yyyy \at h:mm a')}
          </p>
        </div>
        <div className="ml-auto">
          <button 
            onClick={handleUpdate}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-md bg-foreground px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors"
          >
            {isSaving ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border p-4 bg-muted/30">
              <h2 className="font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" /> Order Items
              </h2>
            </div>
            <div className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Unit Price</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.products?.images?.[0] ? (
                            <img src={item.products.images[0]} alt="" className="h-10 w-10 rounded object-cover border border-border" />
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center border border-border">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium">{item.product_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{order.currency === 'INR' ? '₹' : '$'}{item.unit_price}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {order.currency === 'INR' ? '₹' : '$'}{(item.unit_price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-border p-4 bg-muted/10 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{order.currency === 'INR' ? '₹' : '$'}{order.total_amount}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                  <span>Total</span>
                  <span>{order.currency === 'INR' ? '₹' : '$'}{order.total_amount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fulfillment & Tracking */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border p-4 bg-muted/30">
              <h2 className="font-semibold flex items-center gap-2">
                <Truck className="h-5 w-5 text-muted-foreground" /> Fulfillment
              </h2>
            </div>
            <div className="p-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Order Status</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Tracking Number</label>
                <input 
                  type="text" 
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking #"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Supplier Source</label>
                <div className="p-3 bg-muted rounded-md text-sm flex items-center gap-2 font-medium">
                  {order.order_source === 'zendrop' ? (
                    <><Globe className="h-4 w-4 text-accent" /> Zendrop Fulfillment</>
                  ) : (
                    <><MapPin className="h-4 w-4 text-accent" /> India Local Supplier</>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Customer & Summary */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border p-4 bg-muted/30 flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" /> Customer Info
              </h2>
              <Link to={`/admin/customers`} className="text-xs text-accent hover:underline">View Profile</Link>
            </div>
            <div className="p-4 text-sm space-y-4">
              <div>
                <p className="font-medium text-base">{order.customers?.name || 'N/A'}</p>
                <p className="text-muted-foreground">{order.customers?.email}</p>
                <p className="text-muted-foreground">{order.customers?.phone}</p>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="font-medium mb-1 text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Shipping Address
                </p>
                <p>{order.customers?.address}</p>
                <p>{order.customers?.city}, {order.customers?.state} {order.customers?.pincode}</p>
                <p>{order.customers?.country}</p>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border p-4 bg-muted/30">
              <h2 className="font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" /> Payment Details
              </h2>
            </div>
            <div className="p-4 text-sm space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={`font-medium uppercase text-xs px-2 py-0.5 rounded-full
                  ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                `}>
                  {order.payment_status || 'unpaid'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium uppercase">{order.payment_method || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border p-4 bg-muted/30">
              <h2 className="font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" /> Internal Notes
              </h2>
            </div>
            <div className="p-4">
              <textarea 
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Add private notes about this order..."
                className="w-full h-32 rounded-md border border-border bg-background p-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Just for icon missing in import
function Globe(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <path d="M2 12h20" />
    </svg>
  );
}
