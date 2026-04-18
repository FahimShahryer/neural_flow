"use client";

import type { SimStore } from "@/lib/sim-store";
import type { SimPhase, SimPhaseId } from "@/lib/engine-contract";

type Props<Config, State, Phase extends SimPhaseId, Detail> = {
  store: SimStore<Config, State, Phase, Detail>;
  /**
   * Map of phase id → tailwind color class (applied as both text and the bar
   * segment underneath). Lets each module theme its own phases without the
   * shell knowing ML-specific colors.
   */
  phaseColors?: Partial<Record<Phase, { text: string; bar: string }>>;
};

const DEFAULT_COLOR = {
  text: "text-foreground",
  bar: "bg-foreground",
};

/**
 * Generic phase-trail indicator. Iterates over whatever phases the engine
 * declared, highlights the current one, and renders the event's summary.
 */
export function PhaseTrail<
  Config,
  State,
  Phase extends SimPhaseId,
  Detail,
>({ store, phaseColors }: Props<Config, State, Phase, Detail>) {
  const phases = store((s) => s.engine.phases) as readonly SimPhase[];
  const event = store((s) => s.event);
  const currentPhaseId = (event?.phase ?? phases[0]?.id) as Phase;

  const currentPhase = phases.find((p) => p.id === currentPhaseId);
  const color = phaseColors?.[currentPhaseId] ?? DEFAULT_COLOR;
  const narration = event?.summary ?? currentPhase?.hint ?? "";

  // Some engines emit an 'idle' phase we don't want to surface as a segment.
  const visiblePhases = phases.filter((p) => p.id !== "idle");

  return (
    <div className="overflow-hidden rounded-md border border-border/70 bg-background">
      <div className="grid grid-cols-[auto_1fr] items-center gap-3 px-3 py-2">
        <div
          className={`font-mono text-[11px] font-semibold uppercase tracking-wider ${color.text}`}
        >
          {currentPhase?.label ?? "—"}
        </div>
        <div className="min-w-0 truncate text-xs leading-snug text-foreground/90">
          {narration}
        </div>
      </div>
      <div
        className="grid gap-px bg-border/60"
        style={{
          gridTemplateColumns: `repeat(${Math.max(1, visiblePhases.length)}, minmax(0, 1fr))`,
        }}
      >
        {visiblePhases.map((p) => {
          const c = phaseColors?.[p.id as Phase] ?? DEFAULT_COLOR;
          const active = p.id === currentPhaseId;
          return (
            <div
              key={p.id}
              className={`h-1 transition-colors ${active ? c.bar : "bg-transparent"}`}
            />
          );
        })}
      </div>
    </div>
  );
}
