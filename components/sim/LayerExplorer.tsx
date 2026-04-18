"use client";

import { useMemo, useState } from "react";
import { Dices, RefreshCw } from "lucide-react";
import { nnEngine, defaultNNConfig } from "@/lib/engines/nn";
import type { ActivationKind, NNPhaseId } from "@/lib/engines/nn";
import { NetworkView } from "./NetworkView";
import { ConfigSelect, ConfigSlider } from "./controls";

const ACTIVATION_OPTIONS = [
  { value: "relu", label: "ReLU" },
  { value: "sigmoid", label: "Sigmoid" },
  { value: "tanh", label: "Tanh" },
  { value: "linear", label: "Linear" },
];

const PRICE_SCALE = 500;

/**
 * LayerExplorer — no training loop, just a live forward pass you can
 * re-shape. Drag the hidden-layer size slider and the whole network
 * re-draws with fresh weights.
 */
export function LayerExplorer() {
  const [hiddenSize, setHiddenSize] = useState(4);
  const [activation, setActivation] = useState<ActivationKind>("relu");
  const [seed, setSeed] = useState(42);
  const [sampleIndex, setSampleIndex] = useState(0);

  const baseConfig = useMemo(() => defaultNNConfig(), []);

  const state = useMemo(() => {
    const config = {
      ...baseConfig,
      layers: [3, hiddenSize, 1],
      activations: [activation, "linear"] as ActivationKind[],
      seed,
    };
    let s = nnEngine.init(config);
    s = { ...s, sampleIndex };
    // Run forward-only: idle → input → forward → predict
    s = nnEngine.step(s).state;
    s = nnEngine.step(s).state;
    s = nnEngine.step(s).state;
    // Hold on a calm phase so the NetworkView edges don't pulse.
    return { ...s, phase: "idle" as NNPhaseId };
  }, [baseConfig, hiddenSize, activation, seed, sampleIndex]);

  const sample = baseConfig.dataset[sampleIndex];
  const prediction = state.prediction ?? 0;
  const actual = sample.y;
  const errorAbs = Math.abs(prediction - actual);
  const errorPct = (errorAbs / Math.max(Math.abs(actual), 0.01)) * 100;

  const labels: (string | undefined)[][] = [
    ["Size", "Beds", "Loc"],
    Array.from({ length: hiddenSize }, () => undefined),
    ["Price"],
  ];

  return (
    <div className="not-prose my-10 rounded-2xl border border-border/70 bg-card/50 p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Layer size explorer
          </div>
          <div className="mt-1 max-w-xl text-sm text-foreground/90">
            Add or remove neurons from the hidden layer. Same inputs,
            same task — only the layer changes. No training yet; this is
            just forward-pass math on random weights.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSeed(Math.floor(Math.random() * 999) + 1)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Dices className="h-3.5 w-3.5" />
            Shuffle weights
          </button>
          <button
            type="button"
            onClick={() =>
              setSampleIndex((s) => (s + 1) % baseConfig.dataset.length)
            }
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-90"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Next sample
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
        <NetworkView
          state={state}
          layerLabels={labels}
          height={320}
        />

        <div className="space-y-4 rounded-xl border border-border/70 bg-background p-4">
          <ConfigSlider
            label="Hidden layer size"
            sublabel="neurons"
            value={hiddenSize}
            min={1}
            max={8}
            step={1}
            onChange={(v) => setHiddenSize(Math.round(v))}
            format={(v) => Math.round(v).toString()}
          />

          <ConfigSelect
            label="Hidden activation"
            value={activation}
            onChange={(v) => setActivation(v as ActivationKind)}
            options={ACTIVATION_OPTIONS}
          />

          <div className="border-t border-border/60 pt-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
            <div className="flex items-baseline justify-between">
              <span>sample</span>
              <span className="text-foreground">
                {sampleIndex + 1}/{baseConfig.dataset.length}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span>actual</span>
              <span className="text-foreground">
                ${Math.round(actual * PRICE_SCALE)}k
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span>predicted</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                ${Math.round(prediction * PRICE_SCALE)}k
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span>error</span>
              <span
                className={
                  errorPct > 50
                    ? "text-red-500"
                    : errorPct > 20
                      ? "text-amber-500"
                      : "text-emerald-500"
                }
              >
                {errorPct.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
