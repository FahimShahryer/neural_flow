/**
 * SimEngine — the framework-level contract every simulation in NeuralFlow implements.
 *
 * The UI shell (LessonShell, Inspector, WhyButton, controls) is engine-agnostic and
 * talks to any engine through this interface. A new CS module (e.g. sorting, TCP,
 * databases) is added by implementing this contract under lib/engines/<name>/.
 *
 * Design notes:
 *
 * - State is plain-data, immutable. Every step/reset/applyConfig returns a new
 *   state. That makes time-travel, undo, and side-by-side comparisons trivial.
 *
 * - `step` returns both the new state and an Event. Events are the narration
 *   spine of every lesson: they carry a phase label (so the UI can light up a
 *   "what's happening right now" indicator) and a short summary. The "why did
 *   that happen?" explainer in step 9 builds on top of these events.
 *
 * - `inspect` is intentionally `unknown`. The engine knows how to decode an id
 *   (e.g. "weight:1:2:0"); the shell just passes clicks through.
 */

export type SimPhaseId = string;

export type SimPhase = {
  id: SimPhaseId;
  /** Human-readable label shown in the phase indicator. */
  label: string;
  /** Optional one-line description for the narration panel. */
  hint?: string;
};

export type SimEvent<Phase extends SimPhaseId = SimPhaseId, Detail = unknown> = {
  phase: Phase;
  /** Short, already-human-readable line. Safe to show directly. */
  summary: string;
  /** Structured data for the inspector / charts. Shape known to the engine. */
  detail?: Detail;
};

export interface SimEngine<
  Config,
  State,
  Phase extends SimPhaseId = SimPhaseId,
  Detail = unknown,
> {
  /** The phases this engine emits, in their canonical teaching order. */
  phases: readonly SimPhase[];

  /** Build a fresh state from a config. Deterministic given the same config. */
  init(config: Config): State;

  /** Advance the simulation by one discrete teaching step. */
  step(state: State): { state: State; event: SimEvent<Phase, Detail> };

  /** Return to a freshly-initialized state, preserving the current config. */
  reset(state: State): State;

  /** Apply a partial config update without full reset (e.g. slider changes). */
  applyConfig(state: State, patch: Partial<Config>): State;

  /** Look up a value by opaque id (e.g. "neuron:1:2", "weight:0:3:1"). */
  inspect(state: State, id: string): unknown;

  /** A longer plain-English explanation for an event, given the state it fired in. */
  explain(event: SimEvent<Phase, Detail>, state: State): string;
}
