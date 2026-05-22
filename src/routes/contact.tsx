import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, MapPin, Phone } from "lucide-react";

export const Route = createFileRoute("/contact")({
  component: Contact,
  head: () => ({
    meta: [
      { title: "Contact — FIT CRAFT HUB" },
      { name: "description", content: "Get in touch with our athlete support team." },
    ],
  }),
});

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  return (
    <div className="container mx-auto px-4 py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">— Contact</p>
      <h1 className="mt-2 font-display text-6xl text-foreground">Get in touch.</h1>
      <div className="mt-12 grid gap-12 md:grid-cols-[1fr_320px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Message sent — we'll reply within 24h.");
            setForm({ name: "", email: "", message: "" });
          }}
          className="space-y-3"
        >
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your name"
            className="w-full rounded-md border border-border bg-background px-4 py-3 focus:border-accent focus:outline-none"
          />
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            className="w-full rounded-md border border-border bg-background px-4 py-3 focus:border-accent focus:outline-none"
          />
          <textarea
            required
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            rows={6}
            placeholder="Tell us what's up…"
            className="w-full rounded-md border border-border bg-background p-4 focus:border-accent focus:outline-none"
          />
          <button className="rounded-md bg-foreground px-7 py-3 text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground hover:bg-accent hover:text-accent-foreground">
            Send message
          </button>
        </form>
        <aside className="space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-4 w-4 text-accent" />
            <div>
              <p className="font-semibold">Email</p>
              <p className="text-muted-foreground">support@fitcrafthub.com</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-4 w-4 text-accent" />
            <div>
              <p className="font-semibold">Phone</p>
              <p className="text-muted-foreground">+1 (555) 010-2024</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 text-accent" />
            <div>
              <p className="font-semibold">HQ</p>
              <p className="text-muted-foreground">Brooklyn, NY</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
