import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Bell, Package, AlertTriangle, CreditCard, Activity, CheckCircle, Clock
} from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/notifications")({
  component: NotificationsManagement,
});

function NotificationsManagement() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, payload => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      toast.error("Failed to load notifications: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      if (error) throw error;
      fetchNotifications();
    } catch (error: any) {
      toast.error("Error marking as read: " + error.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
      if (error) throw error;
      toast.success("All notifications marked as read");
      fetchNotifications();
    } catch (error: any) {
      toast.error("Error marking all as read: " + error.message);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <Package className="h-5 w-5 text-blue-500" />;
      case 'stock': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'payment': return <CreditCard className="h-5 w-5 text-green-500" />;
      case 'api_error': return <Activity className="h-5 w-5 text-red-500" />;
      default: return <Bell className="h-5 w-5 text-accent" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" /> Notifications
        </h1>
        <button 
          onClick={markAllAsRead}
          className="flex items-center gap-2 rounded-md bg-white border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors dark:bg-card"
        >
          <CheckCircle className="h-4 w-4" /> Mark All as Read
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
            <Bell className="h-12 w-12 opacity-20 mb-4" />
            <p>You're all caught up! No notifications.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`flex gap-4 p-4 transition-colors hover:bg-muted/30 ${!notification.is_read ? 'bg-accent/5 dark:bg-accent/10' : ''}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background border border-border">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-sm font-semibold ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {notification.title}
                    </h3>
                    <span className="shrink-0 text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(notification.created_at), 'MMM dd, h:mm a')}
                    </span>
                  </div>
                  <p className={`mt-1 text-sm ${!notification.is_read ? 'text-foreground/90' : 'text-muted-foreground'}`}>
                    {notification.message}
                  </p>
                  
                  {!notification.is_read && (
                    <button 
                      onClick={() => markAsRead(notification.id)}
                      className="mt-3 text-xs font-semibold text-accent hover:underline"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
                {!notification.is_read && (
                  <div className="flex h-3 w-3 shrink-0 rounded-full bg-accent mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
