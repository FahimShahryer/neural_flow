import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-24">
      <div className="font-mono text-xs uppercase tracking-widest text-neutral-500">
        NeuralFlow
      </div>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight md:text-6xl">
        Learn how neural networks actually work.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
        An interactive teaching platform. Start simple, go deep — configure,
        drag, simulate, and see every weight change in real time. Currently
        covering neural networks and deep learning; more of CS coming.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/learn/nn/01-what-is-a-neuron"
          className="inline-flex h-12 items-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Start lesson 1 →
        </Link>
      </div>
      <p className="mt-16 font-mono text-xs text-neutral-500">
        step 1 · foundation scaffold
      </p>
    </main>
  );
}
