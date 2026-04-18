"use client";

import { useEffect, useRef } from "react";
import type { SimStore } from "./sim-store";
import type { SimPhaseId } from "./engine-contract";

/**
 * Runs the step loop while `playing` is true. Lives outside the store so the
 * store stays render-agnostic and timer lifecycle binds to a component.
 */
export function useSimPlayback<
  Config,
  State,
  Phase extends SimPhaseId,
  Detail,
>(store: SimStore<Config, State, Phase, Detail>): void {
  const playing = store((s) => s.playing);
  const speedMs = store((s) => s.speedMs);
  const step = store((s) => s.step);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
      return;
    }
    timer.current = setInterval(() => step(), speedMs);
    return () => {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
    };
  }, [playing, speedMs, step]);
}
