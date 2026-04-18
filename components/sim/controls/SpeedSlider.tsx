"use client";

import { Gauge } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import type { SimStore } from "@/lib/sim-store";
import type { SimPhaseId } from "@/lib/engine-contract";

type Props<Config, State, Phase extends SimPhaseId, Detail> = {
  store: SimStore<Config, State, Phase, Detail>;
  /** Minimum / maximum speed in ms-per-step. Lower = faster. */
  minMs?: number;
  maxMs?: number;
};

/**
 * Speed slider. Label converts ms-per-step into a user-facing "faster/slower"
 * direction, because "700 ms delay" is less intuitive than a speed dial.
 */
export function SpeedSlider<
  Config,
  State,
  Phase extends SimPhaseId,
  Detail,
>({ store, minMs = 120, maxMs = 1800 }: Props<Config, State, Phase, Detail>) {
  const speedMs = store((s) => s.speedMs);
  const setSpeed = store((s) => s.setSpeed);

  const span = maxMs - minMs;
  // Invert so the right side of the slider = faster.
  const sliderValue = 100 - ((speedMs - minMs) / span) * 100;
  const onChange = (vals: number | readonly number[]) => {
    const v = Array.isArray(vals) ? vals[0] : vals;
    if (typeof v !== "number") return;
    const ms = minMs + ((100 - v) / 100) * span;
    setSpeed(ms);
  };

  return (
    <div className="flex items-center gap-2">
      <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Speed
      </span>
      <div className="w-28">
        <Slider
          min={0}
          max={100}
          step={1}
          value={[sliderValue]}
          onValueChange={onChange}
        />
      </div>
    </div>
  );
}
