"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  MousePointerClick,
  Circle,
  Zap,
  Anchor,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useNNSim } from "./nn-store";
import type { NNState } from "@/lib/engines/nn";

type InspectKind = "neuron" | "weight" | "bias";
type ParsedId =
  | { kind: "neuron"; layer: number; index: number }
  | { kind: "weight"; layerPair: number; outIdx: number; inIdx: number }
  | { kind: "bias"; layerPair: number; index: number };

function parseId(id: string): ParsedId | null {
  const parts = id.split(":");
  const kind = parts[0] as InspectKind;
  const nums = parts.slice(1).map(Number);
  if (nums.some((n) => !Number.isInteger(n) || n < 0)) return null;
  if (kind === "neuron" && nums.length === 2) {
    return { kind: "neuron", layer: nums[0], index: nums[1] };
  }
  if (kind === "weight" && nums.length === 3) {
    return { kind: "weight", layerPair: nums[0], outIdx: nums[1], inIdx: nums[2] };
  }
  if (kind === "bias" && nums.length === 2) {
    return { kind: "bias", layerPair: nums[0], index: nums[1] };
  }
  return null;
}

const HISTORY_CAP = 48;

type Props = {
  selectedId: string | null;
  onClear: () => void;
  /** Optional per-layer neuron labels to show friendly names (e.g. "Size"). */
  layerLabels?: (string | undefined)[][];
};

/**
 * NNInspector — the click-anything-and-see-everything panel.
 *
 * Tracks a short history of whatever is selected so a learner can watch a
 * specific weight shift as SGD runs. For neurons it shows activation + pre-
 * activation + δ; for weights it shows value + gradient + the predicted
 * step; for biases the same minus the incoming geometry.
 */
export function NNInspector({ selectedId, onClear, layerLabels }: Props) {
  const { state, inspect } = useNNSim(
    useShallow((s) => ({
      state: s.state,
      inspect: s.engine.inspect.bind(s.engine),
    })),
  );

  const parsed = selectedId ? parseId(selectedId) : null;

  // Keep a bounded ring buffer of the selected thing's value over time,
  // reset whenever the selection changes.
  const [history, setHistory] = useState<number[]>([]);
  const lastIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedId) {
      setHistory([]);
      lastIdRef.current = null;
      return;
    }
    if (lastIdRef.current !== selectedId) {
      lastIdRef.current = selectedId;
      setHistory([]);
    }
    const value = inspect(state, selectedId);
    if (typeof value !== "number") return;
    setHistory((prev) => {
      const next = prev.length >= HISTORY_CAP ? prev.slice(1) : prev.slice();
      next.push(value);
      return next;
    });
  }, [state, selectedId, inspect]);

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-background p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Inspector
          </div>
        </div>
        {selectedId ? (
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            clear
          </button>
        ) : null}
      </div>

      {parsed ? (
        <InspectorBody
          parsed={parsed}
          state={state}
          layerLabels={layerLabels}
          history={history}
        />
      ) : (
        <div className="rounded-md border border-dashed border-border/70 bg-card/30 px-3 py-6 text-center text-xs text-muted-foreground">
          <MousePointerClick className="mx-auto mb-2 h-4 w-4" />
          Click any neuron or weight on the network to see its value,
          gradient, and how it changes as the model trains.
        </div>
      )}
    </div>
  );
}

function InspectorBody({
  parsed,
  state,
  layerLabels,
  history,
}: {
  parsed: ParsedId;
  state: NNState;
  layerLabels?: (string | undefined)[][];
  history: number[];
}) {
  if (parsed.kind === "neuron") {
    return <NeuronDetails parsed={parsed} state={state} layerLabels={layerLabels} history={history} />;
  }
  if (parsed.kind === "weight") {
    return <WeightDetails parsed={parsed} state={state} layerLabels={layerLabels} history={history} />;
  }
  return <BiasDetails parsed={parsed} state={state} history={history} />;
}

function layerRoleLabel(layer: number, totalLayers: number): string {
  if (layer === 0) return "Input";
  if (layer === totalLayers - 1) return "Output";
  return "Hidden";
}

function NeuronDetails({
  parsed,
  state,
  layerLabels,
  history,
}: {
  parsed: Extract<ParsedId, { kind: "neuron" }>;
  state: NNState;
  layerLabels?: (string | undefined)[][];
  history: number[];
}) {
  const { layer, index } = parsed;
  const total = state.config.layers.length;
  const role = layerRoleLabel(layer, total);
  const value = state.activations[layer]?.[index];
  const preZ = layer > 0 ? state.preActivations[layer - 1]?.[index] : undefined;
  const actFn = layer > 0 ? state.config.activations[layer - 1] : null;
  const delta = layer > 0 ? state.preActivationGradients[layer - 1]?.[index] : undefined;
  const humanLabel = layerLabels?.[layer]?.[index];

  return (
    <div className="space-y-3">
      <Header
        icon={<Circle className="h-3.5 w-3.5" />}
        eyebrow={`${role} · layer ${layer}`}
        title={humanLabel ?? `Neuron ${index + 1}`}
        subtitle={humanLabel ? `Neuron ${index + 1}` : undefined}
      />

      <StatRow label="Activation a" value={value} />
      {preZ !== undefined ? (
        <StatRow label="Pre-activation z" value={preZ} />
      ) : null}
      {actFn ? (
        <MetaRow label="Activation function" value={actFn} />
      ) : (
        <MetaRow label="Activation function" value="input (none)" />
      )}
      {delta !== undefined && Math.abs(delta) > 1e-12 ? (
        <StatRow label="δ (backprop signal)" value={delta} />
      ) : null}

      <Sparkline values={history} />
    </div>
  );
}

function WeightDetails({
  parsed,
  state,
  layerLabels,
  history,
}: {
  parsed: Extract<ParsedId, { kind: "weight" }>;
  state: NNState;
  layerLabels?: (string | undefined)[][];
  history: number[];
}) {
  const { layerPair, outIdx, inIdx } = parsed;
  const weight = state.weights[layerPair]?.[outIdx]?.[inIdx];
  const grad = state.gradients[layerPair]?.[outIdx]?.[inIdx];
  const lr = state.config.learningRate;
  const predicted = typeof weight === "number" && typeof grad === "number" ? weight - lr * grad : undefined;
  const total = state.config.layers.length;

  const fromLayerRole = layerRoleLabel(layerPair, total);
  const toLayerRole = layerRoleLabel(layerPair + 1, total);
  const fromLabel = layerLabels?.[layerPair]?.[inIdx];
  const toLabel = layerLabels?.[layerPair + 1]?.[outIdx];

  return (
    <div className="space-y-3">
      <Header
        icon={<Zap className="h-3.5 w-3.5" />}
        eyebrow="Weight"
        title={
          <span className="inline-flex items-center gap-1.5">
            {fromLabel ?? `${fromLayerRole} ${inIdx + 1}`}
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            {toLabel ?? `${toLayerRole} ${outIdx + 1}`}
          </span>
        }
      />

      <StatRow label="Value" value={weight} />
      <StatRow
        label="Gradient ∂L/∂w"
        value={grad}
        emphasis={typeof grad === "number" && Math.abs(grad) > 1e-12}
      />
      {predicted !== undefined ? (
        <div className="rounded-md border border-border/70 bg-card/40 px-3 py-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
          <div>
            next ≈ w − lr · ∂L/∂w
          </div>
          <div className="mt-1 truncate text-foreground">
            {weight?.toFixed(4)} − {lr.toFixed(3)} · {grad?.toFixed(4)} ={" "}
            <span className="text-emerald-600 dark:text-emerald-400">
              {predicted.toFixed(4)}
            </span>
          </div>
        </div>
      ) : null}

      <Sparkline values={history} />
    </div>
  );
}

function BiasDetails({
  parsed,
  state,
  history,
}: {
  parsed: Extract<ParsedId, { kind: "bias" }>;
  state: NNState;
  history: number[];
}) {
  const { layerPair, index } = parsed;
  const bias = state.biases[layerPair]?.[index];
  const grad = state.biasGradients[layerPair]?.[index];
  const lr = state.config.learningRate;
  const predicted = typeof bias === "number" && typeof grad === "number" ? bias - lr * grad : undefined;
  const total = state.config.layers.length;
  const role = layerRoleLabel(layerPair + 1, total);

  return (
    <div className="space-y-3">
      <Header
        icon={<Anchor className="h-3.5 w-3.5" />}
        eyebrow={`Bias · ${role} ${index + 1}`}
        title={`b[${layerPair}][${index}]`}
      />

      <StatRow label="Value" value={bias} />
      <StatRow label="Gradient ∂L/∂b" value={grad} />
      {predicted !== undefined ? (
        <div className="rounded-md border border-border/70 bg-card/40 px-3 py-2 font-mono text-[11px] text-muted-foreground">
          <div>next ≈ b − lr · ∂L/∂b</div>
          <div className="mt-1 text-foreground">
            {bias?.toFixed(4)} − {lr.toFixed(3)} · {grad?.toFixed(4)} ={" "}
            <span className="text-emerald-600 dark:text-emerald-400">
              {predicted.toFixed(4)}
            </span>
          </div>
        </div>
      ) : null}

      <Sparkline values={history} />
    </div>
  );
}

function Header({
  icon,
  eyebrow,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        {icon}
        <span>{eyebrow}</span>
      </div>
      <div className="mt-1 text-sm font-semibold text-foreground">{title}</div>
      {subtitle ? (
        <div className="text-[11px] text-muted-foreground">{subtitle}</div>
      ) : null}
    </div>
  );
}

function StatRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: number | undefined;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`font-mono tabular-nums ${emphasis ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}
      >
        {typeof value === "number" ? value.toFixed(4) : "—"}
      </span>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return (
      <div className="rounded-md border border-dashed border-border/70 bg-card/30 px-3 py-2 text-[10px] text-muted-foreground">
        Recent values appear as the model trains…
      </div>
    );
  }
  const W = 260;
  const H = 40;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1e-9, max - min);
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * W;
      const y = H - ((v - min) / span) * H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const lastV = values[values.length - 1];
  const lastX = W;
  const lastY = H - ((lastV - min) / span) * H;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-[10px] text-muted-foreground">
        <span className="font-mono uppercase tracking-widest">
          recent
        </span>
        <span className="font-mono tabular-nums">
          {min.toFixed(3)} … {max.toFixed(3)}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-10 w-full"
        preserveAspectRatio="none"
      >
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          className="text-foreground"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={lastX} cy={lastY} r={2.5} fill="currentColor" className="text-foreground" />
      </svg>
    </div>
  );
}
