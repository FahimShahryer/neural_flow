import { describe, expect, it } from "vitest";
import { nnEngine } from "../engine";
import type { NNConfig } from "../types";

function tinyConfig(overrides: Partial<NNConfig> = {}): NNConfig {
  return {
    layers: [3, 4, 1],
    activations: ["relu", "linear"],
    seed: 7,
    dataset: [
      { x: [0.1, 0.2, 0.3], y: 0.5 },
      { x: [0.9, 0.1, 0.4], y: 0.8 },
    ],
    learningRate: 0.05,
    lossKind: "mse",
    ...overrides,
  };
}

/** Number of step() calls that complete one full sample cycle. */
const PHASES_PER_SAMPLE = 7;

describe("nnEngine.init", () => {
  it("builds weights and biases shaped to the topology", () => {
    const s = nnEngine.init(
      tinyConfig({
        layers: [3, 4, 2, 1],
        activations: ["relu", "relu", "linear"],
      }),
    );
    expect(s.weights).toHaveLength(3);
    expect(s.weights[0]).toHaveLength(4);
    expect(s.weights[0][0]).toHaveLength(3);
    expect(s.weights[2][0]).toHaveLength(2);
    expect(s.biases.map((b) => b.length)).toEqual([4, 2, 1]);
    expect(s.phase).toBe("idle");
    expect(s.prediction).toBeNull();
    expect(s.sampleLoss).toBeNull();
    expect(s.lossHistory).toEqual([]);
    expect(s.epochCount).toBe(0);
  });

  it("is deterministic given the same seed", () => {
    const a = nnEngine.init(tinyConfig({ seed: 42 }));
    const b = nnEngine.init(tinyConfig({ seed: 42 }));
    expect(a.weights).toEqual(b.weights);
    expect(a.biases).toEqual(b.biases);
  });

  it("rejects misaligned activations", () => {
    expect(() =>
      nnEngine.init(tinyConfig({ activations: ["relu"] })),
    ).toThrow(/activations\.length/);
  });

  it("rejects an empty dataset", () => {
    expect(() => nnEngine.init(tinyConfig({ dataset: [] }))).toThrow(/dataset/);
  });

  it("rejects non-scalar output layers", () => {
    expect(() =>
      nnEngine.init(
        tinyConfig({
          layers: [3, 4, 2],
          activations: ["relu", "linear"],
        }),
      ),
    ).toThrow(/output layer/);
  });

  it("rejects non-positive learning rates", () => {
    expect(() => nnEngine.init(tinyConfig({ learningRate: 0 }))).toThrow(
      /learningRate/,
    );
    expect(() => nnEngine.init(tinyConfig({ learningRate: -1 }))).toThrow(
      /learningRate/,
    );
  });
});

describe("nnEngine.step — phase progression", () => {
  it("walks idle → input → forward → predict → loss → backward → update → idle", () => {
    const order = [
      "input",
      "forward",
      "predict",
      "loss",
      "backward",
      "update",
      "idle",
    ] as const;
    let s = nnEngine.init(tinyConfig());
    for (const expected of order) {
      const { state, event } = nnEngine.step(s);
      expect(event.phase).toBe(expected);
      expect(state.phase).toBe(expected);
      s = state;
    }
    expect(s.sampleIndex).toBe(1); // advanced during 'backward→update'
  });

  it("increments epochCount and pushes to lossHistory after a full pass over the dataset", () => {
    const config = tinyConfig();
    let s = nnEngine.init(config);
    for (let i = 0; i < config.dataset.length; i++) {
      for (let p = 0; p < PHASES_PER_SAMPLE; p++) {
        s = nnEngine.step(s).state;
      }
    }
    expect(s.sampleIndex).toBe(0);
    expect(s.epochCount).toBe(1);
    expect(s.lossHistory).toHaveLength(1);
    expect(Number.isFinite(s.lossHistory[0])).toBe(true);
  });
});

describe("forward pass math", () => {
  it("matches a hand-computed linear network", () => {
    const config: NNConfig = {
      layers: [2, 2, 1],
      activations: ["linear", "linear"],
      seed: 0,
      dataset: [{ x: [1, 2], y: 0 }],
      learningRate: 0.01,
      lossKind: "mse",
    };
    let s = nnEngine.init(config);
    s = {
      ...s,
      weights: [
        [
          [1, 0],
          [0, 1],
        ],
        [[1, 1]],
      ],
      biases: [[0, 0], [0]],
    };
    s = nnEngine.step(s).state; // idle → input
    s = nnEngine.step(s).state; // input → forward
    expect(s.activations[1]).toEqual([1, 2]);
    expect(s.activations[2]).toEqual([3]);
    s = nnEngine.step(s).state; // forward → predict
    expect(s.prediction).toBe(3);
  });

  it("relu clips the hidden layer as expected", () => {
    const config: NNConfig = {
      layers: [1, 2, 1],
      activations: ["relu", "linear"],
      seed: 0,
      dataset: [{ x: [1], y: 0 }],
      learningRate: 0.01,
      lossKind: "mse",
    };
    let s = nnEngine.init(config);
    s = {
      ...s,
      weights: [[[1], [-1]], [[1, 1]]],
      biases: [[0, 0], [0]],
    };
    s = nnEngine.step(s).state; // → input
    s = nnEngine.step(s).state; // → forward
    expect(s.preActivations[0]).toEqual([1, -1]);
    expect(s.activations[1]).toEqual([1, 0]);
    expect(s.activations[2]).toEqual([1]);
  });
});

describe("nnEngine.inspect", () => {
  it("returns activations, weights, and biases by id", () => {
    let s = nnEngine.init(tinyConfig());
    s = nnEngine.step(s).state; // → input
    s = nnEngine.step(s).state; // → forward
    expect(nnEngine.inspect(s, "neuron:0:0")).toBe(s.activations[0][0]);
    expect(nnEngine.inspect(s, "neuron:1:2")).toBe(s.activations[1][2]);
    expect(nnEngine.inspect(s, "weight:0:1:2")).toBe(s.weights[0][1][2]);
    expect(nnEngine.inspect(s, "bias:1:0")).toBe(s.biases[1][0]);
  });

  it("returns undefined for malformed ids", () => {
    const s = nnEngine.init(tinyConfig());
    expect(nnEngine.inspect(s, "garbage")).toBeUndefined();
    expect(nnEngine.inspect(s, "neuron:0")).toBeUndefined();
    expect(nnEngine.inspect(s, "weight:99:99:99")).toBeUndefined();
  });
});

describe("nnEngine.applyConfig", () => {
  it("re-inits when topology changes", () => {
    const s = nnEngine.init(tinyConfig());
    const s2 = nnEngine.applyConfig(s, { layers: [3, 2, 1] });
    expect(s2.weights[0].length).toBe(2);
    expect(s2.phase).toBe("idle");
  });

  it("preserves weights when only activations change", () => {
    const s = nnEngine.init(tinyConfig());
    const s2 = nnEngine.applyConfig(s, { activations: ["sigmoid", "linear"] });
    expect(s2.weights).toBe(s.weights);
    expect(s2.config.activations).toEqual(["sigmoid", "linear"]);
  });

  it("preserves weights when only learningRate changes", () => {
    const s = nnEngine.init(tinyConfig());
    const s2 = nnEngine.applyConfig(s, { learningRate: 0.5 });
    expect(s2.weights).toBe(s.weights);
    expect(s2.config.learningRate).toBe(0.5);
  });
});

describe("nnEngine.reset", () => {
  it("returns a fresh state with the same config", () => {
    let s = nnEngine.init(tinyConfig());
    for (let i = 0; i < PHASES_PER_SAMPLE * 3; i++) s = nnEngine.step(s).state;
    const r = nnEngine.reset(s);
    expect(r.phase).toBe("idle");
    expect(r.sampleIndex).toBe(0);
    expect(r.prediction).toBeNull();
    expect(r.lossHistory).toEqual([]);
    expect(r.epochCount).toBe(0);
    expect(r.weights).toEqual(nnEngine.init(tinyConfig()).weights);
  });
});

describe("nnEngine.explain", () => {
  it("gives a plain-English sentence for every phase", () => {
    const s = nnEngine.init(tinyConfig());
    for (const p of [
      "idle",
      "input",
      "forward",
      "predict",
      "loss",
      "backward",
      "update",
    ] as const) {
      const e = { phase: p, summary: "" };
      const out = nnEngine.explain(e, s);
      expect(out.length).toBeGreaterThan(10);
    }
  });
});
