"use client";

import { X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useNNSim } from "./nn-store";
import { PRESETS, type DramaticPreset, type PresetKey } from "./presets";
import { defaultNNConfig } from "@/lib/engines/nn";

type Props = {
  activeKey: PresetKey | null;
  onLoad: (preset: DramaticPreset) => void;
  onClear: () => void;
};

/**
 * Row of preset buttons + active-preset banner.
 * Sits above the phase trail so learners see the "hook" before anything moves.
 */
export function PresetsBar({ activeKey, onLoad, onClear }: Props) {
  const active = PRESETS.find((p) => p.key === activeKey) ?? null;
  const { state } = useNNSim(useShallow((s) => ({ state: s.state })));

  const narration = active ? active.narrate(state) : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Dramatic demos
        </span>
        {PRESETS.map((p) => {
          const isActive = p.key === activeKey;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => (isActive ? onClear() : onLoad(p))}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
                isActive
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground hover:bg-accent"
              }`}
              title={p.tagline}
            >
              <span aria-hidden>{p.emoji}</span>
              {p.name}
            </button>
          );
        })}
        {active ? (
          <button
            type="button"
            onClick={onClear}
            className="ml-1 inline-flex h-6 items-center gap-1 rounded-full border border-border/70 px-2 text-[10px] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            reset to defaults
          </button>
        ) : null}
      </div>

      {active ? (
        <div className="rounded-xl border border-rose-200/70 bg-rose-50/70 p-3 dark:border-rose-900/60 dark:bg-rose-950/30">
          <div className="flex items-start gap-3">
            <div className="text-2xl leading-none" aria-hidden>
              {active.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <div className="font-mono text-[10px] uppercase tracking-widest text-rose-700 dark:text-rose-300">
                  Running
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {active.name}
                </div>
              </div>
              <div className="mt-1 text-xs leading-relaxed text-foreground/90">
                {active.headline}
              </div>
              {narration ? (
                <div className="mt-2 rounded-md bg-background/60 px-2.5 py-1.5 font-mono text-[11px] leading-relaxed text-foreground/90">
                  {narration}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Produce a clean NNConfig that merges a preset's partial overrides over the default. */
export function resolvePresetConfig(preset: DramaticPreset) {
  const base = defaultNNConfig();
  return { ...base, ...preset.config };
}
