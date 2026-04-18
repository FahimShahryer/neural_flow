import { describe, expect, it } from "vitest";
import { createSimStore } from "../sim-store";
import { nnEngine } from "../engines/nn/engine";
import type { NNConfig } from "../engines/nn/types";

function tinyConfig(overrides: Partial<NNConfig> = {}): NNConfig {
  return {
    layers: [3, 4, 1],
    activations: ["relu", "linear"],
    seed: 7,
    dataset: [
      { x: [0.1, 0.2, 0.3], y: 0.5 },
      { x: [0.9, 0.1, 0.4], y: 0.8 },
    ],
    ...overrides,
  };
}

describe("createSimStore", () => {
  it("initializes from the provided config", () => {
    const store = createSimStore(nnEngine, tinyConfig());
    const s = store.getState();
    expect(s.state.phase).toBe("idle");
    expect(s.state.sampleIndex).toBe(0);
    expect(s.event).toBeNull();
    expect(s.playing).toBe(false);
  });

  it("step advances the engine and records the event", () => {
    const store = createSimStore(nnEngine, tinyConfig());
    store.getState().step();
    const s = store.getState();
    expect(s.state.phase).toBe("input");
    expect(s.event?.phase).toBe("input");
  });

  it("reset returns to idle and pauses", () => {
    const store = createSimStore(nnEngine, tinyConfig());
    store.getState().step();
    store.getState().step();
    store.getState().play();
    store.getState().reset();
    const s = store.getState();
    expect(s.state.phase).toBe("idle");
    expect(s.state.sampleIndex).toBe(0);
    expect(s.playing).toBe(false);
    expect(s.event).toBeNull();
  });

  it("applyConfig propagates to the engine", () => {
    const store = createSimStore(nnEngine, tinyConfig());
    store.getState().applyConfig({ activations: ["sigmoid", "linear"] });
    expect(store.getState().state.config.activations).toEqual([
      "sigmoid",
      "linear",
    ]);
  });

  it("togglePlay flips the playing flag", () => {
    const store = createSimStore(nnEngine, tinyConfig());
    store.getState().togglePlay();
    expect(store.getState().playing).toBe(true);
    store.getState().togglePlay();
    expect(store.getState().playing).toBe(false);
  });

  it("setSpeed clamps to [50, 3000]", () => {
    const store = createSimStore(nnEngine, tinyConfig());
    store.getState().setSpeed(10);
    expect(store.getState().speedMs).toBe(50);
    store.getState().setSpeed(99999);
    expect(store.getState().speedMs).toBe(3000);
    store.getState().setSpeed(250);
    expect(store.getState().speedMs).toBe(250);
  });
});
