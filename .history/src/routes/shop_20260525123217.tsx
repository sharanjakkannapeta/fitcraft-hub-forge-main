import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import type { Product, Category } from "@/lib/types";
import { Search } from "lucide-react";

interface ShopSearch {
  category?: string;
  sort?: string;
  q?: string;
}

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): ShopSearch => ({
    category: typeof s.category === "string" ? s.category : undefined,
    sort: typeof s.sort === "string" ? s.sort : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  component: Shop,
  head: () => ({
    meta: [
      { title: "Shop — FIT CRAFT HUB" },
      { name: "description", content: "Browse all gymnastics & fitness equipment." },
    ],
  }),
});

const PAGE_SIZE = 9;

function Shop() {
  const search = Route.useSearch();
  const nav = Route.useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [minRating, setMinRating] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState(search.q ?? "");

  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .then(({ data }) => setCats((data ?? []) as Category[]));
  }, []);

  useEffect(() => {
    (async () => {
      let query = supabase.from("products").select("*", { count: "exact" });
      if (search.category) {
        const { data: cat } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", search.category)
          .maybeSingle();
        if (cat) query = query.eq("category_id", cat.id);
      }
      if (search.q) query = query.ilike("name", `%${search.q}%`);
      query = query.lte("price", maxPrice).gte("rating", minRating);
      switch (search.sort) {
        case "price-asc":
          query = query.order("price", { ascending: true });
          break;
        case "price-desc":
          query = query.order("price", { ascending: false });
          break;
        case "rating":
          query = query.order("rating", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }
      const { data } = await query;
      setProducts((data ?? []) as Product[]);
      setPage(1);
    })();
  }, [search.category, search.sort, search.q, maxPrice, minRating]);

  const paged = useMemo(
    () => products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [products, page],
  );
  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">— Shop</p>
        <h1 className="mt-2 font-display text-5xl text-foreground">All Equipment</h1>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            nav({ search: { ...search, q: q || undefined } });
          }}
          className="relative flex-1 min-w-[200px]"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-md border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-accent focus:outline-none"
          />
        </form>
        <select
          value={search.sort ?? "new"}
          onChange={(e) => nav({ search: { ...search, sort: e.target.value } })}
          className="rounded-md border border-border bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
        >
          <option value="new">Newest</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-8 self-start lg:sticky lg:top-24">
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
              Category
            </h3>
            <div className="flex flex-col gap-1.5 text-sm">
              <button
                onClick={() => nav({ search: { ...search, category: undefined } })}
                className={`text-left transition-smooth hover:text-accent ${!search.category ? "font-semibold text-foreground" : "text-muted-foreground"}`}
              >
                All
              </button>
              {cats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => nav({ search: { ...search, category: c.slug } })}
                  className={`text-left transition-smooth hover:text-accent ${search.category === c.slug ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
              MaxMax price: ₹{maxPrice}
            </h3>
            <input
              type="range"
              min={20}
              max={10000}
              step={10}
              value={maxPrice}
              onChange={(e) => setMaxPrice(+e.target.value)}
              className="w-full accent-accent"
            />
          </div>
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
              Min rating
            </h3>
            <div className="flex gap-1">
              {[0, 3, 4, 4.5].map((r) => (
                <button
                  key={r}
                  onClick={() => setMinRating(r)}
                  className={`rounded-md border px-2.5 py-1 text-xs transition-smooth ${minRating === r ? "border-accent bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:border-accent"}`}
                >
                  {r === 0 ? "All" : `${r}★+`}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div>
          <p className="mb-4 text-sm text-muted-foreground">{products.length} products</p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {paged.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {products.length === 0 && (
            <p className="py-20 text-center text-muted-foreground">
              No products match your filters.
            </p>
          )}
          {totalPages > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`h-9 w-9 rounded-md border text-sm transition-smooth ${page === i + 1 ? "border-foreground bg-foreground text-primary-foreground" : "border-border hover:border-accent"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
