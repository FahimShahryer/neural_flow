"use client";

import { useState } from "react";
import { Mafs, Coordinates, Plot, Theme } from "mafs";
import { activate } from "@/lib/engines/nn/math";
import type { ActivationKind } from "@/lib/engines/nn";

const COLORS: Record<ActivationKind, string> = {
  linear: Theme.foreground,
  relu: Theme.blue,
  sigmoid: Theme.pink,
  tanh: Theme.orange,
};

const DESCRIPTIONS: Record<ActivationKind, string> = {
  linear: "Passes its input through untouched.",
  relu: "Zero for negatives, identity for positives. The go-to default.",
  sigmoid: "Squashes everything into (0, 1). Used for yes/no outputs.",
  tanh: "Squashes into (−1, 1). Zero-centered relative of sigmoid.",
};

const KINDS: ActivationKind[] = ["linear", "relu", "sigmoid", "tanh"];

type Props = {
  /** Force a single activation. If omitted, renders a switcher with all four. */
  kind?: ActivationKind;
};

/**
 * ActivationPlot — live Mafs graph of an activation function.
 * Without a kind prop, it renders a picker so the learner can switch
 * between the four and feel each one's shape.
 */
export function ActivationPlot({ kind }: Props) {
  const [selected, setSelected] = useState<ActivationKind>(kind ?? "relu");
  const active = kind ?? selected;

  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-border/70 bg-background">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Activation function
          </div>
          <div className="mt-0.5 text-sm font-semibold text-foreground">
            y = {active}(z)
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {DESCRIPTIONS[active]}
          </div>
        </div>

        {!kind ? (
          <div className="flex flex-wrap gap-1.5">
            {KINDS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setSelected(k)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  active === k
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="px-2 pb-2 pt-2">
        <Mafs
          height={260}
          viewBox={{ x: [-4, 4], y: [-1.6, 2.6] }}
          pan={false}
          zoom={false}
        >
          <Coordinates.Cartesian
            xAxis={{ labels: (n) => n.toString() }}
            yAxis={{ labels: (n) => n.toString() }}
          />
          <Plot.OfX y={(x) => activate(x, active)} color={COLORS[active]} />
        </Mafs>
      </div>
    </div>
  );
}
