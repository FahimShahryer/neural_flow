/**
 * SimStore — a generic Zustand store that wraps any SimEngine.
 *
 * Usage (per engine instance, module-level so a page can import it):
 *
 *   export const useNNSim = createSimStore(nnEngine, defaultNNConfig());
 *
 * The store owns `state`, the last emitted `event`, playback flags
 * (`playing`, `speedMs`), and exposes step/play/pause/reset/applyConfig
 * as actions. Components subscribe with granular selectors to stay fast.
 *
 * This is the same store shape every future CS module will use.
 */

import { create, type StoreApi, type UseBoundStore } from "zustand";
import type {
  SimEngine,
  SimEvent,
  SimPhaseId,
} from "./engine-contract";

export type SimStoreState<Config, State, Phase extends SimPhaseId, Detail> = {
  readonly engine: SimEngine<Config, State, Phase, Detail>;
  state: State;
  event: SimEvent<Phase, Detail> | null;
  playing: boolean;
  speedMs: number;
  /** Advance one phase and record the event. */
  step: () => void;
  /** Return to a freshly-initialized state. Pauses playback. */
  reset: () => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSpeed: (speedMs: number) => void;
  applyConfig: (patch: Partial<Config>) => void;
};

export type SimStore<Config, State, Phase extends SimPhaseId, Detail> =
  UseBoundStore<StoreApi<SimStoreState<Config, State, Phase, Detail>>>;

export function createSimStore<
  Config,
  State,
  Phase extends SimPhaseId,
  Detail,
>(
  engine: SimEngine<Config, State, Phase, Detail>,
  initialConfig: Config,
): SimStore<Config, State, Phase, Detail> {
  return create<SimStoreState<Config, State, Phase, Detail>>((set, get) => ({
    engine,
    state: engine.init(initialConfig),
    event: null,
    playing: false,
    speedMs: 700,

    step: () => {
      const { engine, state } = get();
      const { state: next, event } = engine.step(state);
      set({ state: next, event });
    },

    reset: () => {
      const { engine, state } = get();
      set({ state: engine.reset(state), event: null, playing: false });
    },

    play: () => set({ playing: true }),
    pause: () => set({ playing: false }),
    togglePlay: () => set((s) => ({ playing: !s.playing })),
    setSpeed: (speedMs: number) =>
      set({ speedMs: Math.max(50, Math.min(3000, Math.round(speedMs))) }),

    applyConfig: (patch: Partial<Config>) => {
      const { engine, state } = get();
      set({
        state: engine.applyConfig(state, patch),
        event: null,
        playing: false,
      });
    },
  }));
}
