"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import type { SimStore } from "@/lib/sim-store";
import type { SimPhaseId } from "@/lib/engine-contract";

type Props<Config, State, Phase extends SimPhaseId, Detail> = {
  store: SimStore<Config, State, Phase, Detail>;
  /** Start expanded. Default false — learners click to reveal. */
  defaultOpen?: boolean;
};

/**
 * WhyPanel — a collapsible "why did that happen?" panel backed by the
 * engine's own explain() method. Engine-agnostic: every module gets a
 * consistent pattern for "tell me more about what just happened."
 */
export function WhyPanel<
  Config,
  State,
  Phase extends SimPhaseId,
  Detail,
>({ store, defaultOpen = false }: Props<Config, State, Phase, Detail>) {
  const [open, setOpen] = useState(defaultOpen);
  // Pull each slice with its own selector so references stay stable across
  // renders. Never `.bind()` inside a selector — it returns a fresh
  // function each render and can drive infinite re-render loops.
  const state = store((s) => s.state);
  const event = store((s) => s.event);
  const engine = store((s) => s.engine);

  if (!event) {
    return (
      <div className="rounded-md border border-dashed border-border/70 bg-background px-3 py-2 text-xs text-muted-foreground">
        Press Step or Play above. Then expand this panel to see what just
        happened in plain English.
      </div>
    );
  }

  const body = engine.explain(event, state);

  return (
    <div className="overflow-hidden rounded-md border border-border/70 bg-background">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-accent/40"
      >
        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="flex-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Why did that happen?
        </span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
      {open ? (
        <div className="border-t border-border/60 px-3 py-3 text-xs leading-relaxed text-foreground/90">
          {body}
        </div>
      ) : null}
    </div>
  );
}
