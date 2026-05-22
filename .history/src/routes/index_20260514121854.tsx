import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Truck, ShieldCheck, Headset, Award } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import type { Product, Category } from "@/lib/types";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "FIT CRAFT HUB — Premium Gymnastics & Fitness Equipment" },
      {
        name: "description",
        content:
          "Shop pro-grade rings, barbells, parallettes, recovery tools, and athletic apparel.",
      },
    ],
  }),
});

function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [bestsellers, setBest] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);

  useEffect(() => {
    (async () => {
      const [f, b, c] = await Promise.all([
        supabase.from("products").select("*").eq("is_featured", true).limit(8),
        supabase.from("products").select("*").eq("is_best_seller", true).limit(4),
        supabase.from("categories").select("*"),
      ]);
      setFeatured((f.data ?? []) as Product[]);
      setBest((b.data ?? []) as Product[]);
      setCats((c.data ?? []) as Category[]);
    })();
  }, []);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-foreground text-primary-foreground">
        <div className="absolute inset-0 opacity-50">
          <img
            src={heroImg}
            alt=""
            width={1600}
            height={1200}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground via-foreground/80 to-transparent" />
        </div>
        <div className="container relative mx-auto grid min-h-[80vh] items-center px-4 py-20">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
              — Engineered for athletes
            </p>
            <h1 className="font-display text-6xl leading-[0.95] tracking-tight text-balance md:text-8xl">
              Train like
              <br />
              <span className="text-accent">you mean it.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base text-primary-foreground/75 md:text-lg">
              Pro-spec gymnastics rings, Olympic barbells, and recovery tools — built to outlast
              your hardest sessions.
            </p>
            <div className="mt-10 flex flex-wrap g2ap-3">
              <Link
                to="/shop"
                className="group inline-flex items-center gap-2 rounded-md bg-accent px-7 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-accent-foreground transition-smooth hover:opacity-90"
              >
                Shop the collection{" "}
                <ArrowRight className="h-4 w-4 transition-smooth group-hover:translate-x-1" />
              </Link>
              <Link
                to="/about"
                className="rounded-md border border-primary-foreground/30 px-7 py-3.5 text-xs font-bold uppercase tracking-[0.2em] transition-smooth hover:bg-primary-foreground/10"
              >
                Our story
              </Link>
            </div>
            <div className="mt-12 grid max-w-xl grid-cols-3 gap-6 border-t border-primary-foreground/15 pt-8">
              <div>
                <p className="font-display text-3xl text-accent">15K+</p>
                <p className="text-xs uppercase tracking-wider text-primary-foreground/60">
                  Athletes
                </p>
              </div>
              <div>
                <p className="font-display text-3xl text-accent">200+</p>
                <p className="text-xs uppercase tracking-wider text-primary-foreground/60">
                  Products
                </p>
              </div>
              <div>
                <p className="font-display text-3xl text-accent">4.9★</p>
                <p className="text-xs uppercase tracking-wider text-primary-foreground/60">
                  Avg rating
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PERKS */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto grid grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4">
          {[
            { icon: Truck, label: "Free shipping over $200" },
            { icon: ShieldCheck, label: "Lifetime warranty" },
            { icon: Headset, label: "24/7 athlete support" },
            { icon: Award, label: "FIG-spec quality" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-accent" />
              <span className="text-xs font-medium uppercase tracking-wider text-foreground">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
              — Categories
            </p>
            <h2 className="mt-2 font-display text-5xl text-foreground">Shop by discipline</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {cats.map((c) => (
            <Link
              key={c.id}
              to="/shop"
              search={{ category: c.slug }}
              className="group relative aspect-[3/4] overflow-hidden rounded-lg bg-muted"
            >
              {c.image_url && (
                <img
                  src={c.image_url}
                  alt={c.name}
                  loading="lazy"
                  className="h-full w-full object-cover brightness-75 transition-smooth group-hover:scale-110 group-hover:brightness-100"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="font-display text-2xl text-primary-foreground">{c.name}</h3>
                <p className="mt-1 flex items-center gap-1 text-xs uppercase tracking-wider text-accent opacity-0 transition-smooth group-hover:opacity-100">
                  Explore <ArrowRight className="h-3 w-3" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
              — Featured
            </p>
            <h2 className="mt-2 font-display text-5xl text-foreground">Built different.</h2>
          </div>
          <Link
            to="/shop"
            className="hidden text-xs font-semibold uppercase tracking-wider text-foreground hover:text-accent md:block"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* PROMO BANNER */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid overflow-hidden rounded-2xl bg-gradient-hero text-primary-foreground md:grid-cols-2">
          <div className="flex flex-col justify-center p-10 md:p-16">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
              — Limited drop
            </p>
            <h2 className="mt-4 font-display text-5xl leading-tight md:text-6xl">
              10% off your first order
            </h2>
            <p className="mt-4 max-w-md text-primary-foreground/70">
              Use code <span className="font-mono font-bold text-accent">WELCOME10</span> at
              checkout. Plus free shipping above $200.
            </p>
            <Link
              to="/shop"
              className="mt-8 inline-flex w-fit items-center gap-2 rounded-md bg-accent px-7 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-accent-foreground hover:opacity-90"
            >
              Shop now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative min-h-[300px]">
            <img
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200"
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* BESTSELLERS */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            — Best sellers
          </p>
          <h2 className="mt-2 font-display text-5xl text-foreground">What athletes choose.</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {bestsellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-card py-20">
        <div className="container mx-auto px-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">— Reviews</p>
          <h2 className="mt-2 font-display text-5xl text-foreground">
            Trusted by the disciplined.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                n: "Mira K.",
                r: "Coach, Calisthenics",
                q: "The wooden rings feel exactly like FIG comp gear. Straps haven't slipped once in 8 months.",
              },
              {
                n: "Diego R.",
                r: "Olympic Weightlifter",
                q: "Bar whip is dialed. Knurling grips without shredding hands. Worth every dollar.",
              },
              {
                n: "Sara L.",
                r: "CrossFit Athlete",
                q: "Massage gun + rope + tank — full kit landed in 3 days. Quality is genuinely premium.",
              },
            ].map((t) => (
              <div key={t.n} className="rounded-lg bg-background p-8 shadow-card">
                <div className="mb-4 flex gap-1 text-accent">
                  {"★★★★★".split("").map((s, i) => (
                    <span key={i}>{s}</span>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-foreground">"{t.q}"</p>
                <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-foreground">
                  {t.n}
                </p>
                <p className="text-xs text-muted-foreground">{t.r}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
