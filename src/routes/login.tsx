import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/`, data: { full_name: name } },
      });
      if (error) toast.error(error.message);
      else { toast.success("Account created — you're in."); nav({ to: "/" }); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else { toast.success("Welcome back."); nav({ to: "/" }); }
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-12">
      <div className="w-full">
        <Link to="/" className="flex items-baseline justify-center gap-1">
          <span className="font-display text-3xl tracking-wider">FIT CRAFT</span>
          <span className="font-display text-3xl tracking-wider text-accent">HUB</span>
        </Link>
        <div className="mt-8 rounded-lg border border-border bg-card p-8 shadow-card">
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-md bg-secondary p-1 text-xs font-semibold uppercase tracking-wider">
            <button onClick={() => setMode("signin")} className={`rounded-md py-2 transition-smooth ${mode === "signin" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Sign in</button>
            <button onClick={() => setMode("signup")} className={`rounded-md py-2 transition-smooth ${mode === "signup" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Sign up</button>
          </div>
          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:border-accent focus:outline-none" />
            )}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:border-accent focus:outline-none" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required minLength={6} className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:border-accent focus:outline-none" />
            <button disabled={loading} className="w-full rounded-md bg-foreground py-3 text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50">
              {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">Email confirmation may be required depending on your project settings.</p>
        </div>
      </div>
    </div>
  );
}
