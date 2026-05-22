import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/types";

export const Route = createFileRoute("/wishlist")({ component: Wishlist });

function Wishlist() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  useEffect(() => {
    if (!user) return;
    supabase
      .from("wishlist_items")
      .select("products(*)")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setItems(
          ((data ?? []) as unknown as { products: Product }[])
            .map((r) => r.products)
            .filter(Boolean),
        );
      });
  }, [user]);

  if (loading) return <div className="container mx-auto px-4 py-20 text-center">Loading…</div>;
  if (!user)
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-4xl">Wishlist</h1>
        <Link
          to="/login"
          className="mt-6 inline-block rounded-md bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground"
        >
          Sign in
        </Link>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-display text-5xl">Wishlist</h1>
      {items.length === 0 ? (
        <p className="mt-8 text-muted-foreground">Nothing saved yet.</p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
