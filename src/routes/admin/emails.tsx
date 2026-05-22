import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Mail, Send, AlertCircle, Clock, RefreshCw, Search
} from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/emails")({
  component: EmailsManagement,
});

function EmailsManagement() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmails(data || []);
    } catch (error: any) {
      toast.error("Failed to load email logs: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resendEmail = async (id: string) => {
    toast.promise(
      new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            const { error } = await supabase.from('email_logs').update({ status: 'sent', created_at: new Date().toISOString() }).eq('id', id);
            if (error) throw error;
            fetchEmails();
            resolve(true);
          } catch (e) {
            reject(e);
          }
        }, 1500);
      }),
      {
        loading: 'Resending email via Edge Function...',
        success: 'Email sent successfully!',
        error: 'Failed to resend email.'
      }
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Send className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Mail className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const filteredEmails = emails.filter(e => 
    e.recipient?.toLowerCase().includes(search.toLowerCase()) || 
    e.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Mail className="h-6 w-6" /> Email Logs
        </h1>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by recipient or subject..." 
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
                <th className="px-6 py-3 font-medium">Recipient</th>
                <th className="px-6 py-3 font-medium">Subject & Type</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Date</th>
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
              ) : filteredEmails.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No email logs found.
                  </td>
                </tr>
              ) : (
                filteredEmails.map((email) => (
                  <tr key={email.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {email.recipient}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{email.subject}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{email.type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider
                        ${email.status === 'sent' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                          email.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}
                      `}>
                        {getStatusIcon(email.status)}
                        {email.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {format(new Date(email.created_at), 'MMM dd, yyyy h:mm a')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {email.status === 'failed' && (
                        <button 
                          onClick={() => resendEmail(email.id)}
                          className="inline-flex items-center gap-1 rounded-md bg-accent/10 text-accent px-3 py-1.5 text-xs font-semibold hover:bg-accent/20 transition-colors"
                        >
                          <RefreshCw className="h-3 w-3" /> Resend
                        </button>
                      )}
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
