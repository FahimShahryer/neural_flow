/**
 * SimEngine — the framework-level contract every simulation in NeuralFlow implements.
 *
 * The UI shell (LessonShell, Inspector, WhyButton, controls) is engine-agnostic and
 * talks to any engine through this interface. A new CS module (e.g. sorting, TCP,
 * databases) is added by implementing this contract under lib/engines/<name>/.
 *
 * This is a stub; step 3 fleshes it out alongside the first NN engine.
 */

export interface SimEngine<Config, State, Event> {
  /** Build a fresh state from a config. Deterministic given the same config + seed. */
  init(config: Config): State;

  /** Advance the simulation by one discrete step. Returns the new state and the event
   *  that was produced (for narration, logging, and "why did that happen?"). */
  step(state: State): { state: State; event: Event };

  /** Reset to the initial state without losing the config. */
  reset(state: State): State;

  /** Inspect an entity inside the simulation (e.g. a neuron, a weight, an edge).
   *  The returned value is opaque to the shell — the renderer knows how to display it. */
  inspect(state: State, id: string): unknown;

  /** Produce a plain-English explanation for an event. */
  explain(event: Event): string;
}
