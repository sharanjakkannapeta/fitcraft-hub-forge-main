import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({ meta: [{ title: "About — FIT CRAFT HUB" }, { name: "description", content: "Built by athletes, for athletes." }] }),
});

function About() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">— Our story</p>
      <h1 className="mt-2 font-display text-6xl leading-[0.95] text-foreground">Built by athletes,<br />for athletes.</h1>
      <div className="mt-10 space-y-6 text-lg leading-relaxed text-foreground/80">
        <p>FIT CRAFT HUB started in a garage gym with a busted pair of straps and a stubborn idea: equipment shouldn't be the limiting factor.</p>
        <p>We obsess over the small things — knurl depth, ring grain, bearing tolerance — so you can obsess over the only thing that matters: the next rep.</p>
        <p>Every product is tested by working coaches, competing athletes, and weekend warriors before it reaches your door. If it doesn't earn its place in our gym, it doesn't earn yours.</p>
      </div>
      <div className="mt-16 grid gap-8 border-t border-border pt-12 md:grid-cols-3">
        {[{ n: "2019", l: "Founded" }, { n: "15K+", l: "Athletes served" }, { n: "200+", l: "Products engineered" }].map((s) => (
          <div key={s.l}><p className="font-display text-5xl text-accent">{s.n}</p><p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">{s.l}</p></div>
        ))}
      </div>
    </div>
  );
}
