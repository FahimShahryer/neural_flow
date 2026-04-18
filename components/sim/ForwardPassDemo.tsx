"use client";

import { useState } from "react";
import { MousePointerClick } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { NetworkView } from "./NetworkView";
import { LossChart } from "./LossChart";
import { useNNSim } from "./nn/nn-store";
import { NNConfigPanel } from "./nn/NNConfigPanel";
import { NNInspector } from "./nn/NNInspector";
import {
  PhaseTrail,
  PlaybackControls,
  SpeedSlider,
} from "./controls";
import { useSimPlayback } from "@/lib/use-sim-playback";
import type { NNPhaseId } from "@/lib/engines/nn";

const HOUSE_LABELS: (string | undefined)[][] = [
  ["Size", "Beds", "Loc"],
  [undefined, undefined, undefined, undefined],
  ["Price"],
];

const PHASE_COLORS = {
  idle: { text: "text-muted-foreground", bar: "bg-muted-foreground/40" },
  input: { text: "text-blue-500", bar: "bg-blue-500" },
  forward: { text: "text-amber-500", bar: "bg-amber-500" },
  predict: { text: "text-emerald-500", bar: "bg-emerald-500" },
  loss: { text: "text-rose-500", bar: "bg-rose-500" },
  backward: { text: "text-amber-500", bar: "bg-amber-500" },
  update: { text: "text-emerald-500", bar: "bg-emerald-500" },
} satisfies Partial<Record<NNPhaseId, { text: string; bar: string }>>;

/**
 * ForwardPassDemo — drives the shared NN store through the full training
 * loop and renders the network + loss curve together. Step 7 wires the
 * inspector panel in; step 9 adds the dramatic demo presets.
 */
export function ForwardPassDemo() {
  useSimPlayback(useNNSim);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showWeightLabels, setShowWeightLabels] = useState(false);

  const {
    state,
    sampleIndex,
    lossHistory,
    epochCount,
    sampleLoss,
  } = useNNSim(
    useShallow((s) => ({
      state: s.state,
      sampleIndex: s.state.sampleIndex,
      lossHistory: s.state.lossHistory,
      epochCount: s.state.epochCount,
      sampleLoss: s.state.sampleLoss,
    })),
  );

  return (
    <div className="not-prose my-10 rounded-2xl border border-border/70 bg-card/50 p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Preview — a full training loop
          </div>
          <div className="mt-1 max-w-xl text-sm text-foreground/90">
            Three inputs → a hidden layer → one output. Press Play to watch
            the full cycle — forward, loss, backprop, weight update — and the
            loss curve fall as the model learns.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SpeedSlider store={useNNSim} />
          <PlaybackControls store={useNNSim} />
        </div>
      </div>

      <div className="mb-3">
        <PhaseTrail store={useNNSim} phaseColors={PHASE_COLORS} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <NetworkView
            state={state}
            layerLabels={HOUSE_LABELS}
            onInspect={setSelectedId}
            showWeightLabels={showWeightLabels}
            height={340}
          />
          <LossChart
            history={lossHistory}
            epochCount={epochCount}
            sampleLoss={sampleLoss}
          />
        </div>
        <div className="space-y-4">
          <NNInspector
            selectedId={selectedId}
            onClear={() => setSelectedId(null)}
            layerLabels={HOUSE_LABELS}
          />
          <NNConfigPanel
            showWeightLabels={showWeightLabels}
            onShowWeightLabelsChange={setShowWeightLabels}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="inline-flex items-center gap-1.5 text-muted-foreground">
          <MousePointerClick className="h-3 w-3" />
          Click any neuron or edge to inspect it live.
        </div>
        <div className="font-mono text-[11px] text-muted-foreground">
          Sample #{sampleIndex + 1} / {state.config.dataset.length} · epoch{" "}
          {epochCount}
        </div>
      </div>
    </div>
  );
}
