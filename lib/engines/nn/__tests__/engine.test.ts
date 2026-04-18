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
    ...overrides,
  };
}

describe("nnEngine.init", () => {
  it("builds weights and biases shaped to the topology", () => {
    const s = nnEngine.init(
      tinyConfig({
        layers: [3, 4, 2, 1],
        activations: ["relu", "relu", "linear"],
      }),
    );
    expect(s.weights).toHaveLength(3);
    expect(s.weights[0]).toHaveLength(4); // first hidden: 4 neurons
    expect(s.weights[0][0]).toHaveLength(3); // each takes 3 inputs
    expect(s.weights[2][0]).toHaveLength(2);
    expect(s.biases.map((b) => b.length)).toEqual([4, 2, 1]);
    expect(s.phase).toBe("idle");
    expect(s.prediction).toBeNull();
  });

  it("is deterministic given the same seed", () => {
    const a = nnEngine.init(tinyConfig({ seed: 42 }));
    const b = nnEngine.init(tinyConfig({ seed: 42 }));
    expect(a.weights).toEqual(b.weights);
    expect(a.biases).toEqual(b.biases);
  });

  it("differs across seeds", () => {
    const a = nnEngine.init(tinyConfig({ seed: 1 }));
    const b = nnEngine.init(tinyConfig({ seed: 999 }));
    expect(a.weights).not.toEqual(b.weights);
  });

  it("rejects misaligned activations", () => {
    expect(() =>
      nnEngine.init(tinyConfig({ activations: ["relu"] })),
    ).toThrow(/activations\.length/);
  });

  it("rejects an empty dataset", () => {
    expect(() => nnEngine.init(tinyConfig({ dataset: [] }))).toThrow(/dataset/);
  });

  it("rejects samples with the wrong input length", () => {
    expect(() =>
      nnEngine.init(
        tinyConfig({ dataset: [{ x: [0.1, 0.2], y: 0.5 }] }),
      ),
    ).toThrow(/length/);
  });
});

describe("nnEngine.step — phase progression", () => {
  it("walks idle → input → forward → predict → idle", () => {
    let s = nnEngine.init(tinyConfig());
    expect(s.phase).toBe("idle");

    const e1 = nnEngine.step(s);
    expect(e1.event.phase).toBe("input");
    expect(e1.state.phase).toBe("input");

    const e2 = nnEngine.step(e1.state);
    expect(e2.event.phase).toBe("forward");
    expect(e2.state.phase).toBe("forward");

    const e3 = nnEngine.step(e2.state);
    expect(e3.event.phase).toBe("predict");
    expect(e3.state.phase).toBe("predict");
    expect(e3.state.prediction).not.toBeNull();

    const e4 = nnEngine.step(e3.state);
    expect(e4.event.phase).toBe("idle");
    expect(e4.state.phase).toBe("idle");
    expect(e4.state.sampleIndex).toBe(1);
  });

  it("wraps sampleIndex back to 0 after the last sample", () => {
    const config = tinyConfig();
    let s = nnEngine.init(config);
    // Run through every sample once, four phases each.
    for (let i = 0; i < config.dataset.length; i++) {
      for (let j = 0; j < 4; j++) {
        s = nnEngine.step(s).state;
      }
    }
    expect(s.sampleIndex).toBe(0);
  });
});

describe("forward pass math", () => {
  it("matches a hand-computed linear network", () => {
    // A dead-simple 2 → 2 → 1 network with all-linear activations and no bias
    // — pick weights so we can check the output by hand.
    const config: NNConfig = {
      layers: [2, 2, 1],
      activations: ["linear", "linear"],
      seed: 0,
      dataset: [{ x: [1, 2], y: 0 }],
    };
    let s = nnEngine.init(config);
    // Overwrite init'd weights with known values.
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

    // Walk to the 'forward' phase so activations are populated.
    s = nnEngine.step(s).state; // idle → input
    s = nnEngine.step(s).state; // input → forward

    // Layer 1: z = [1·1 + 0·2, 0·1 + 1·2] = [1, 2]; linear → a = [1, 2]
    expect(s.activations[1]).toEqual([1, 2]);
    // Layer 2: z = [1·1 + 1·2] = 3; linear → a = 3
    expect(s.activations[2]).toEqual([3]);

    // One more step → prediction is set.
    s = nnEngine.step(s).state;
    expect(s.prediction).toBe(3);
  });

  it("relu clips the hidden layer as expected", () => {
    const config: NNConfig = {
      layers: [1, 2, 1],
      activations: ["relu", "linear"],
      seed: 0,
      dataset: [{ x: [1], y: 0 }],
    };
    let s = nnEngine.init(config);
    s = {
      ...s,
      weights: [
        [[1], [-1]], // one positive, one negative pre-activation
        [[1, 1]],
      ],
      biases: [[0, 0], [0]],
    };
    s = nnEngine.step(s).state; // idle → input
    s = nnEngine.step(s).state; // input → forward
    expect(s.preActivations[0]).toEqual([1, -1]);
    expect(s.activations[1]).toEqual([1, 0]); // relu clips the -1
    expect(s.activations[2]).toEqual([1]);
  });
});

describe("nnEngine.inspect", () => {
  it("returns activations, weights, and biases by id", () => {
    let s = nnEngine.init(tinyConfig());
    // Run a forward pass so activations[1..] are populated.
    s = nnEngine.step(s).state;
    s = nnEngine.step(s).state;

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
});

describe("nnEngine.reset", () => {
  it("returns a fresh state with the same config", () => {
    let s = nnEngine.init(tinyConfig());
    s = nnEngine.step(s).state;
    s = nnEngine.step(s).state;
    const r = nnEngine.reset(s);
    expect(r.phase).toBe("idle");
    expect(r.sampleIndex).toBe(0);
    expect(r.prediction).toBeNull();
    expect(r.weights).toEqual(nnEngine.init(tinyConfig()).weights);
  });
});

describe("nnEngine.explain", () => {
  it("gives a plain-English sentence for every phase", () => {
    const s = nnEngine.init(tinyConfig());
    for (const p of ["idle", "input", "forward", "predict"] as const) {
      const e = { phase: p, summary: "" };
      const out = nnEngine.explain(e, s);
      expect(out.length).toBeGreaterThan(10);
    }
  });
});
