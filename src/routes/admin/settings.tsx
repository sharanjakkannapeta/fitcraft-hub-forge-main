import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Settings as SettingsIcon, Save, Store, CreditCard, Mail, 
  MessageSquare, BarChart, Truck, Percent
} from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsManagement,
});

function SettingsManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    general: { store_name: "", currency: "USD", logo_url: "" },
    shipping: { flat_rate: 0, cod_enabled: false, cod_charge: 0 },
    payment: { stripe_key: "", razorpay_key: "" },
    zendrop: { api_key: "", store_id: "" },
    email: { smtp_host: "", smtp_user: "", smtp_pass: "", smtp_port: "587" },
    whatsapp: { twilio_sid: "", twilio_token: "", twilio_phone: "" },
    analytics: { ga_id: "", fb_pixel: "" },
    tax: { gst_enabled: false, gst_number: "", gst_rate: 0 }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('settings').select('*');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const parsedSettings = { ...settings };
        data.forEach(item => {
          if (parsedSettings[item.key as keyof typeof parsedSettings]) {
            (parsedSettings as any)[item.key] = item.value;
          }
        });
        setSettings(parsedSettings);
      }
    } catch (error: any) {
      toast.error("Failed to load settings: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const upserts = Object.keys(settings).map(key => ({
        key,
        value: settings[key as keyof typeof settings]
      }));

      const { error } = await supabase.from('settings').upsert(upserts);
      
      if (error) throw error;
      toast.success("Settings saved successfully");
    } catch (error: any) {
      toast.error("Failed to save settings: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (section: keyof typeof settings, field: string, value: any) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value
      }
    });
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" /> Store Settings
        </h1>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-md bg-foreground text-primary-foreground px-6 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
        >
          {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
          Save All Settings
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border p-4 bg-muted/30 flex items-center gap-2">
            <Store className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">General</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Store Name</label>
              <input 
                type="text" 
                value={settings.general.store_name}
                onChange={e => updateSection('general', 'store_name', e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Currency</label>
              <select 
                value={settings.general.currency}
                onChange={e => updateSection('general', 'currency', e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Logo URL (Supabase Storage)</label>
              <input 
                type="text" 
                value={settings.general.logo_url}
                onChange={e => updateSection('general', 'logo_url', e.target.value)}
                placeholder="https://..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>
        </div>

        {/* Shipping & COD */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border p-4 bg-muted/30 flex items-center gap-2">
            <Truck className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Shipping & COD</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Flat Shipping Rate</label>
              <input 
                type="number" 
                value={settings.shipping.flat_rate}
                onChange={e => updateSection('shipping', 'flat_rate', parseFloat(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div className="pt-2 border-t border-border mt-2">
              <div className="flex items-center gap-2 mb-3">
                <input 
                  type="checkbox" 
                  id="cod"
                  checked={settings.shipping.cod_enabled}
                  onChange={e => updateSection('shipping', 'cod_enabled', e.target.checked)}
                  className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                />
                <label htmlFor="cod" className="text-sm font-medium">Enable Cash on Delivery (COD)</label>
              </div>
              {settings.shipping.cod_enabled && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">COD Extra Charge</label>
                  <input 
                    type="number" 
                    value={settings.shipping.cod_charge}
                    onChange={e => updateSection('shipping', 'cod_charge', parseFloat(e.target.value))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Gateways */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border p-4 bg-muted/30 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Payment Gateways</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Stripe Public Key</label>
              <input 
                type="text" 
                value={settings.payment.stripe_key}
                onChange={e => updateSection('payment', 'stripe_key', e.target.value)}
                placeholder="pk_test_..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Razorpay Key ID</label>
              <input 
                type="text" 
                value={settings.payment.razorpay_key}
                onChange={e => updateSection('payment', 'razorpay_key', e.target.value)}
                placeholder="rzp_test_..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>
        </div>

        {/* Tax / GST */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border p-4 bg-muted/30 flex items-center gap-2">
            <Percent className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Tax & GST (India)</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <input 
                type="checkbox" 
                id="gst"
                checked={settings.tax.gst_enabled}
                onChange={e => updateSection('tax', 'gst_enabled', e.target.checked)}
                className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
              />
              <label htmlFor="gst" className="text-sm font-medium">Enable GST Calculation</label>
            </div>
            {settings.tax.gst_enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">GST Number</label>
                  <input 
                    type="text" 
                    value={settings.tax.gst_number}
                    onChange={e => updateSection('tax', 'gst_number', e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Default GST Rate (%)</label>
                  <input 
                    type="number" 
                    value={settings.tax.gst_rate}
                    onChange={e => updateSection('tax', 'gst_rate', parseFloat(e.target.value))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Email SMTP */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border p-4 bg-muted/30 flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">SMTP Email Settings</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-muted-foreground mb-1">SMTP Host</label>
                <input 
                  type="text" 
                  value={settings.email.smtp_host}
                  onChange={e => updateSection('email', 'smtp_host', e.target.value)}
                  placeholder="smtp.mailgun.org"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Port</label>
                <input 
                  type="text" 
                  value={settings.email.smtp_port}
                  onChange={e => updateSection('email', 'smtp_port', e.target.value)}
                  placeholder="587"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Username</label>
              <input 
                type="text" 
                value={settings.email.smtp_user}
                onChange={e => updateSection('email', 'smtp_user', e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Password</label>
              <input 
                type="password" 
                value={settings.email.smtp_pass}
                onChange={e => updateSection('email', 'smtp_pass', e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>
        </div>

        {/* Analytics & Tracking */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border p-4 bg-muted/30 flex items-center gap-2">
            <BarChart className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Analytics & Tracking</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Google Analytics ID</label>
              <input 
                type="text" 
                value={settings.analytics.ga_id}
                onChange={e => updateSection('analytics', 'ga_id', e.target.value)}
                placeholder="G-XXXXXXXXXX"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Facebook Pixel ID</label>
              <input 
                type="text" 
                value={settings.analytics.fb_pixel}
                onChange={e => updateSection('analytics', 'fb_pixel', e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
