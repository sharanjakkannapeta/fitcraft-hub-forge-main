import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Heart, Minus, Plus, ShoppingBag, Star, Truck, ShieldCheck, ArrowLeft } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/types";

export const Route = createFileRoute("/product/$slug")({ component: ProductPage });

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  user_id: string;
  created_at: string;
}

function ProductPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const loadReviews = async (pid: string) => {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", pid)
      .order("created_at", { ascending: false });
    setReviews((data ?? []) as Review[]);
  };

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (!p) return;
      setProduct(p as Product);
      loadReviews(p.id);
      if (p.category_id) {
        const { data: r } = await supabase
          .from("products")
          .select("*")
          .eq("category_id", p.category_id)
          .neq("id", p.id)
          .limit(4);
        setRelated((r ?? []) as Product[]);
      }
    })();
  }, [slug]);

  if (!product)
    return (
      <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading…</div>
    );

  const addToCart = async () => {
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");

    const existingItem = existingCart.find((item: any) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += qty;
    } else {
      existingCart.push({
        ...product,
        quantity: qty,
      });
    }

    localStorage.setItem("cart", JSON.stringify(existingCart));

    toast.success(`${qty} × ${product.name} added to cart`);
  };

  const addWish = async () => {
    if (!user) return toast.error("Sign in to save");
    const { error } = await supabase
      .from("wishlist_items")
      .insert({ user_id: user.id, product_id: product.id });
    if (error?.code === "23505") toast.info("Already in wishlist");
    else if (error) toast.error(error.message);
    else toast.success("Saved");
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Sign in to review");
    const { error } = await supabase
      .from("reviews")
      .upsert(
        { product_id: product.id, user_id: user.id, rating, comment },
        { onConflict: "product_id,user_id" },
      );
    if (error) toast.error(error.message);
    else {
      toast.success("Review posted");
      setComment("");
      loadReviews(product.id);
    }
  };

  const discount = product.compare_at_price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        to="/shop"
        className="mb-6 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Back to shop
      </Link>

      <div className="grid gap-12 md:grid-cols-2">
        <div className="overflow-hidden rounded-lg bg-card shadow-card">
          {product.image_url && (
            <img
              src={product.image_url}
              alt={product.name}
              className="aspect-square w-full object-cover"
            />
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            {product.brand}
          </p>
          <h1 className="mt-2 font-display text-5xl leading-tight text-foreground">
            {product.name}
          </h1>
          <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="font-semibold text-foreground">{product.rating.toFixed(1)}</span>
            </div>
            <span>·</span>
            <span>{product.review_count} reviews</span>
            <span>·</span>
            <span className="text-accent">In stock</span>
          </div>
          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-display text-5xl text-foreground">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {product.compare_at_price && (
              <>
                <span className="text-xl text-muted-foreground line-through">
                  ₹{product.compare_at_price.toLocaleString("en-IN")}
                </span>
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
                  −{discount}%
                </span>
              </>
            )}
          </div>
          <p className="mt-6 leading-relaxed text-foreground/80">{product.description}</p>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-md border border-border">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2.5">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-semibold">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-3 py-2.5">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={addToCart}
              disabled={product.stock <= 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground transition-smooth hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            >
              <ShoppingBag className="h-4 w-4" /> Add to cart
            </button>
            <button
              onClick={addWish}
              className="rounded-md border border-border p-3 transition-smooth hover:border-accent hover:text-accent"
            >
              <Heart className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-border pt-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-accent" /> Free shipping over $200
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" /> Lifetime warranty
            </div>
          </div>
        </div>
      </div>

      {/* REVIEWS */}
      <section className="mt-20">
        <h2 className="font-display text-3xl text-foreground">Reviews</h2>
        {user && (
          <form
            onSubmit={submitReview}
            className="mt-6 rounded-lg border border-border bg-card p-6"
          >
            <div className="mb-3 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} onClick={() => setRating(n)}>
                  <Star
                    className={`h-5 w-5 ${n <= rating ? "fill-accent text-accent" : "text-muted-foreground"}`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              placeholder="Share your experience…"
              className="w-full rounded-md border border-border bg-background p-3 text-sm focus:border-accent focus:outline-none"
              rows={3}
            />
            <button className="mt-3 rounded-md bg-foreground px-5 py-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:bg-accent hover:text-accent-foreground">
              Post review
            </button>
          </form>
        )}
        <div className="mt-6 space-y-4">
          {reviews.length === 0 && (
            <p className="text-sm text-muted-foreground">No reviews yet — be the first.</p>
          )}
          {reviews.map((r) => (
            <div key={r.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-4 w-4 ${n <= r.rating ? "fill-accent text-accent" : "text-muted-foreground"}`}
                  />
                ))}
              </div>
              <p className="mt-2 text-sm text-foreground">{r.comment}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-3xl text-foreground">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p: Product) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
