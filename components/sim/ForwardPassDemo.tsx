"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, SkipForward, RotateCcw, MousePointerClick } from "lucide-react";
import { nnEngine, defaultNNConfig } from "@/lib/engines/nn";
import type { NNState, NNPhaseId } from "@/lib/engines/nn";
import type { SimEvent } from "@/lib/engine-contract";
import { NetworkView } from "./NetworkView";

const HOUSE_LABELS: (string | undefined)[][] = [
  ["Size", "Beds", "Loc"],
  [undefined, undefined, undefined, undefined],
  ["Price"],
];

const PHASE_STYLE: Record<
  NNPhaseId,
  { label: string; accent: string; bar: string }
> = {
  idle: {
    label: "Idle",
    accent: "text-muted-foreground",
    bar: "bg-muted-foreground/40",
  },
  input: {
    label: "1 · Input loaded",
    accent: "text-blue-500",
    bar: "bg-blue-500",
  },
  forward: {
    label: "2 · Forward pass",
    accent: "text-amber-500",
    bar: "bg-amber-500",
  },
  predict: {
    label: "3 · Prediction",
    accent: "text-emerald-500",
    bar: "bg-emerald-500",
  },
};

const STEP_INTERVAL_MS = 700;

/**
 * ForwardPassDemo — drives the NN engine phase-by-phase and renders it through
 * NetworkView. Step 5 replaces the ad-hoc controls here with a proper
 * control-primitives package; step 9 adds the "why did that happen?" overlay.
 */
export function ForwardPassDemo() {
  const [state, setState] = useState<NNState>(() => nnEngine.init(defaultNNConfig()));
  const [event, setEvent] = useState<SimEvent | null>(null);
  const [playing, setPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doStep = () => {
    setState((prev) => {
      const { state: next, event } = nnEngine.step(prev);
      setEvent(event);
      return next;
    });
  };

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    timerRef.current = setInterval(doStep, STEP_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [playing]);

  const reset = () => {
    setPlaying(false);
    setState((prev) => nnEngine.reset(prev));
    setEvent(null);
    setSelectedId(null);
  };

  const phase = PHASE_STYLE[state.phase];
  const narration = event?.summary ?? "Press Step to begin the forward pass.";
  const inspected = useMemo(() => {
    if (!selectedId) return null;
    const value = nnEngine.inspect(state, selectedId);
    if (typeof value !== "number") return null;
    return { id: selectedId, value };
  }, [state, selectedId]);

  return (
    <div className="not-prose my-10 rounded-2xl border border-border/70 bg-card/50 p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Preview — a full neural network
          </div>
          <div className="mt-1 text-sm text-foreground/90">
            Three inputs → one hidden layer of four neurons → one output. Tap
            Step to watch a sample flow through phase-by-phase, or Play to let
            it run.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={doStep}
            disabled={playing}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-40"
          >
            <SkipForward className="h-3.5 w-3.5" />
            Step
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-foreground px-4 text-xs font-medium text-background transition-opacity hover:opacity-90"
          >
            {playing ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Play
              </>
            )}
          </button>
          <button
            onClick={reset}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      <div className="mb-3 overflow-hidden rounded-md border border-border/70 bg-background">
        <div className="grid grid-cols-[auto_1fr] items-center gap-3 px-3 py-2">
          <div
            className={`font-mono text-[11px] font-semibold uppercase tracking-wider ${phase.accent}`}
          >
            {phase.label}
          </div>
          <div className="text-xs leading-snug text-foreground/90">{narration}</div>
        </div>
        <div className="grid grid-cols-3 gap-px bg-border/60">
          {(["input", "forward", "predict"] as const).map((p) => (
            <div
              key={p}
              className={`h-1 ${state.phase === p ? PHASE_STYLE[p].bar : "bg-transparent"}`}
            />
          ))}
        </div>
      </div>

      <NetworkView
        state={state}
        layerLabels={HOUSE_LABELS}
        onInspect={setSelectedId}
        showWeightLabels
        height={340}
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="inline-flex items-center gap-1.5 text-muted-foreground">
          <MousePointerClick className="h-3 w-3" />
          Click any neuron or edge to inspect its value.
        </div>
        <div className="font-mono text-[11px] text-muted-foreground">
          Sample #{state.sampleIndex + 1} / {state.config.dataset.length}
        </div>
      </div>

      {inspected ? (
        <div className="mt-3 rounded-md border border-border/70 bg-background px-3 py-2 font-mono text-xs">
          <span className="text-muted-foreground">{inspected.id} · </span>
          <span className="text-foreground">{inspected.value.toFixed(4)}</span>
        </div>
      ) : null}
    </div>
  );
}
