import Link from "next/link";
import { ArrowRight, Zap, MousePointer2, Gauge } from "lucide-react";
import { TopBar } from "@/components/lesson/TopBar";
import { MODULES } from "@/lib/curriculum";

const PILLARS = [
  {
    icon: MousePointer2,
    title: "Drag anything",
    body: "Every weight, input, and hyperparameter is a slider. Change it and the simulation updates live.",
  },
  {
    icon: Zap,
    title: "See every step",
    body: "Forward pass, backprop, weight updates — each phase visualized in the exact order it happens.",
  },
  {
    icon: Gauge,
    title: "Start simple, go deep",
    body: "One neuron today, full training loops soon, every CS topic eventually.",
  },
];

export default function Home() {
  const nn = MODULES[0];
  const firstBuilt = nn.lessons.find((l) => l.built);

  return (
    <>
      <TopBar />
      <main className="relative mx-auto w-full max-w-6xl px-6 pb-24 pt-16 sm:pt-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_at_center,oklch(0.97_0_0/0.8),transparent_65%)] dark:bg-[radial-gradient(ellipse_at_center,oklch(0.3_0_0/0.5),transparent_65%)]" />

        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Module 1 · Neural Networks
          </div>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
            Learn how neural networks actually work.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
            An interactive teaching platform. Configure, drag, simulate — and
            see every weight change in real time. No walls of text. No passive
            videos. Just one clean idea at a time, made tangible.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            {firstBuilt ? (
              <Link
                href={`/learn/${nn.slug}/${firstBuilt.slug}`}
                className="group inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Start with lesson 1
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : null}
            <Link
              href={`/learn/${nn.slug}/${nn.lessons[0].slug}`}
              className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Browse the full curriculum
            </Link>
          </div>
        </div>

        <div className="mt-24 grid gap-4 sm:grid-cols-3">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-border/70 bg-card/50 p-5 transition-colors hover:border-foreground/30"
            >
              <p.icon className="h-4 w-4 text-muted-foreground" />
              <div className="mt-4 text-base font-semibold">{p.title}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {p.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-24">
          <div className="flex items-baseline justify-between">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Curriculum — {nn.name}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {nn.lessons.filter((l) => l.built).length}/{nn.lessons.length} ready
            </div>
          </div>
          <ol className="mt-4 divide-y divide-border/60 rounded-xl border border-border/70 bg-card/30">
            {nn.lessons.map((l) => (
              <li key={l.slug}>
                {l.built ? (
                  <Link
                    href={`/learn/${nn.slug}/${l.slug}`}
                    className="group flex items-baseline gap-4 px-5 py-4 transition-colors hover:bg-accent/40"
                  >
                    <span className="w-6 font-mono text-xs tabular-nums text-muted-foreground">
                      {String(l.order).padStart(2, "0")}
                    </span>
                    <span className="flex-1">
                      <span className="text-sm font-medium text-foreground">
                        {l.title}
                      </span>
                      <span className="ml-3 text-sm text-muted-foreground">
                        {l.summary}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </Link>
                ) : (
                  <div className="flex items-baseline gap-4 px-5 py-4 text-muted-foreground/60">
                    <span className="w-6 font-mono text-xs tabular-nums">
                      {String(l.order).padStart(2, "0")}
                    </span>
                    <span className="flex-1">
                      <span className="text-sm font-medium">{l.title}</span>
                      <span className="ml-3 text-sm">{l.summary}</span>
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-widest">
                      soon
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>

        <footer className="mt-24 flex items-center justify-between border-t border-border/60 pt-6 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          <span>NeuralFlow · step 2 · design system</span>
          <span>made for learners, not lectures</span>
        </footer>
      </main>
    </>
  );
}
