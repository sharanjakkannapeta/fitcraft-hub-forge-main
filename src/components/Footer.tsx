import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

export function Footer() {
  const [email, setEmail] = useState("");
  return (
    <footer className="mt-24 border-t border-border bg-foreground text-primary-foreground">
      <div className="container mx-auto grid gap-12 px-4 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-3xl tracking-wider">FIT CRAFT</span>
            <span className="font-display text-3xl tracking-wider text-accent">HUB</span>
          </div>
          <p className="mt-4 max-w-md text-sm text-primary-foreground/70">
            Engineered fitness equipment for athletes who measure progress in reps, not promises.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Subscribed. Welcome to the crew.");
              setEmail("");
            }}
            className="mt-6 flex max-w-md gap-2"
          >
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              placeholder="you@athlete.com"
              className="flex-1 rounded-md border border-primary-foreground/20 bg-transparent px-4 py-2 text-sm placeholder:text-primary-foreground/40 focus:border-accent focus:outline-none"
            />
            <button className="rounded-md bg-accent px-5 py-2 text-xs font-semibold uppercase tracking-wider text-accent-foreground transition-smooth hover:opacity-90">
              Join
            </button>
          </form>
        </div>
        <div>
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-accent">Shop</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/70">
            <li>
              <Link to="/shop" className="hover:text-primary-foreground">
                All Products
              </Link>
            </li>
            <li>
              <Link
                to="/shop"
                search={{ category: "gymnastics" }}
                className="hover:text-primary-foreground"
              >
                Gymnastics
              </Link>
            </li>
            <li>
              <Link
                to="/shop"
                search={{ category: "strength" }}
                className="hover:text-primary-foreground"
              >
                Strength
              </Link>
            </li>
            <li>
              <Link
                to="/shop"
                search={{ category: "cardio" }}
                className="hover:text-primary-foreground"
              >
                Cardio
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-accent">
            Company
          </h4>
          <ul className="space-y-2 text-sm text-primary-foreground/70">
            <li>
              <Link to="/about" className="hover:text-primary-foreground">
                About
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-primary-foreground">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/account" className="hover:text-primary-foreground">
                My Account
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 py-6 text-center text-xs text-primary-foreground/50">
        © {new Date().getFullYear()} FIT CRAFT HUB. Built for the disciplined.
      </div>
    </footer>
  );
}
