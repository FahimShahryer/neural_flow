"use client";

import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import type { SimStore } from "@/lib/sim-store";
import type { SimPhaseId } from "@/lib/engine-contract";

type Props<Config, State, Phase extends SimPhaseId, Detail> = {
  store: SimStore<Config, State, Phase, Detail>;
  /** Hide the speed slider — use when you lay out speed separately. */
  hideSpeed?: boolean;
};

export function PlaybackControls<
  Config,
  State,
  Phase extends SimPhaseId,
  Detail,
>({ store }: Props<Config, State, Phase, Detail>) {
  const { playing, step, togglePlay, reset } = store(
    useShallow((s) => ({
      playing: s.playing,
      step: s.step,
      togglePlay: s.togglePlay,
      reset: s.reset,
    })),
  );

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={step}
        disabled={playing}
        aria-label="Step one phase"
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        <SkipForward className="h-3.5 w-3.5" />
        Step
      </button>
      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? "Pause" : "Play"}
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
        type="button"
        onClick={reset}
        aria-label="Reset to the initial state"
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset
      </button>
    </div>
  );
}
