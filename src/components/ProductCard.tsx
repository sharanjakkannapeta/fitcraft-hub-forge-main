import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Star } from "lucide-react";
import type { Product } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();

  // ADD TO CART
  const addToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const existingCart = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );

    const existingItem = existingCart.find(
      (item: any) => item.id === product.id
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      existingCart.push({
        ...product,
        quantity: 1,
      });
    }

    localStorage.setItem(
      "cart",
      JSON.stringify(existingCart)
    );

    toast.success(`${product.name} added to cart`);
  };

  // ADD TO WISHLIST
  const addToWishlist = async (
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Sign in to save favorites");
      return;
    }

    const { error } = await supabase
      .from("wishlist_items")
      .insert({
        user_id: user.id,
        product_id: product.id,
      });

    if (error?.code === "23505") {
      toast.info("Already in wishlist");
    } else if (error) {
      toast.error(error.message);
    } else {
      toast.success("Saved to wishlist");
    }
  };

  // DISCOUNT
  const discount = product.compare_at_price
    ? Math.round(
        (1 -
          product.price /
            product.compare_at_price) *
          100
      )
    : 0;

  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group relative block overflow-hidden rounded-lg bg-card shadow-card transition-smooth hover:shadow-elegant"
    >
      {/* IMAGE */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={
            product.image_url ||
            "https://via.placeholder.com/500"
          }
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-smooth group-hover:scale-105"
        />

        {/* DISCOUNT BADGE */}
        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
            -{discount}%
          </span>
        )}

        {/* WISHLIST BUTTON */}
        <button
          onClick={addToWishlist}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 backdrop-blur transition-smooth hover:bg-accent hover:text-accent-foreground group-hover:opacity-100"
        >
          <Heart className="h-4 w-4" />
        </button>

        {/* ADD TO CART BUTTON */}
        <button
          onClick={addToCart}
          className="absolute inset-x-3 bottom-3 inline-flex translate-y-2 items-center justify-center gap-2 rounded-md bg-foreground py-2.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground opacity-0 transition-smooth hover:bg-accent hover:text-accent-foreground group-hover:translate-y-0 group-hover:opacity-100"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          Add to cart
        </button>
      </div>

      {/* PRODUCT DETAILS */}
      <div className="p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {product.brand}
        </p>

        <h3 className="mt-1 line-clamp-1 text-sm font-semibold text-foreground">
          {product.name}
        </h3>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl text-foreground">
              ₹{product.price.toLocaleString("en-IN")}
            </span>

            {product.compare_at_price && (
              <span className="text-xs text-muted-foreground line-through">
                ₹{product.compare_at_price.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-accent text-accent" />
            <span>{product.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
