"use client";

import { Dices, Settings2 } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { ConfigSelect, ConfigSlider, ConfigToggle } from "../controls";
import { useNNSim } from "./nn-store";
import type { ActivationKind } from "@/lib/engines/nn";

const ACTIVATION_OPTIONS: { value: ActivationKind; label: string }[] = [
  { value: "linear", label: "linear" },
  { value: "relu", label: "ReLU" },
  { value: "sigmoid", label: "sigmoid" },
  { value: "tanh", label: "tanh" },
];

type Props = {
  /** Parent owns whether weight labels are visible on edges. */
  showWeightLabels: boolean;
  onShowWeightLabelsChange: (value: boolean) => void;
};

/**
 * NN-specific config panel. Composes the generic control primitives; any
 * future module builds its own version the same way.
 */
export function NNConfigPanel({
  showWeightLabels,
  onShowWeightLabelsChange,
}: Props) {
  const { activations, seed, layerSizes, applyConfig } = useNNSim(
    useShallow((s) => ({
      activations: s.state.config.activations,
      seed: s.state.config.seed,
      layerSizes: s.state.config.layers,
      applyConfig: s.applyConfig,
    })),
  );

  // Layer indices for which an activation applies. activations[i] acts on
  // the outputs of layer i+1 (so label it by that layer's role).
  const activationLabels = activations.map((_, i) => {
    const isOutput = i === activations.length - 1;
    return isOutput ? "Output activation" : `Hidden activation (layer ${i + 1})`;
  });

  return (
    <div className="space-y-4 rounded-xl border border-border/70 bg-background p-4">
      <div className="flex items-center gap-1.5">
        <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Network
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {activations.map((a, i) => (
          <ConfigSelect
            key={`act-${i}`}
            label={activationLabels[i]}
            value={a}
            onChange={(v) => {
              const next = activations.slice();
              next[i] = v as ActivationKind;
              applyConfig({ activations: next });
            }}
            options={ACTIVATION_OPTIONS}
          />
        ))}
      </div>

      <ConfigSlider
        label="Seed"
        sublabel="new random weights"
        value={seed}
        min={1}
        max={999}
        step={1}
        onChange={(v) => applyConfig({ seed: Math.round(v) })}
        format={(v) => Math.round(v).toString()}
      />

      <ConfigToggle
        label="Show weight values"
        sublabel="on every edge"
        value={showWeightLabels}
        onChange={onShowWeightLabelsChange}
      />

      <button
        type="button"
        onClick={() => applyConfig({ seed: Math.floor(Math.random() * 999) + 1 })}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Dices className="h-3.5 w-3.5" />
        Shuffle weights
      </button>

      <div className="pt-2 font-mono text-[10px] text-muted-foreground">
        topology: [{layerSizes.join(", ")}] · {activations.join(" → ")}
      </div>
    </div>
  );
}
