import { describe, expect, it } from "vitest";
import { nnEngine } from "../engine";
import { computeBackprop } from "../backprop";
import type { NNConfig, NNState } from "../types";

function miniConfig(overrides: Partial<NNConfig> = {}): NNConfig {
  return {
    layers: [3, 4, 1],
    activations: ["tanh", "linear"],
    seed: 13,
    dataset: [{ x: [0.4, -0.2, 0.7], y: 0.5 }],
    learningRate: 0.05,
    lossKind: "mse",
    ...overrides,
  };
}

/** Walk the engine past the 'forward' phase so gradients are computable. */
function runForward(state: NNState): NNState {
  let s = state;
  while (s.phase !== "forward") s = nnEngine.step(s).state;
  return s;
}

/** Re-run forward with a mutated weight and return the resulting sample loss. */
function lossWithMutation(
  state: NNState,
  mutate: (s: NNState) => NNState,
): number {
  let s: NNState = {
    ...mutate(state),
    phase: "idle",
    sampleLoss: null,
    prediction: null,
  };
  // idle → input → forward → predict → loss
  while (s.phase !== "loss") s = nnEngine.step(s).state;
  return s.sampleLoss ?? 0;
}

describe("computeBackprop — numerical gradient check", () => {
  it("weight gradients match central finite differences", () => {
    const config = miniConfig();
    const init = nnEngine.init(config);
    const ready = runForward(init);
    const { gradients } = computeBackprop(ready);
    const eps = 1e-5;

    for (let l = 0; l < ready.weights.length; l++) {
      for (let j = 0; j < ready.weights[l].length; j++) {
        for (let i = 0; i < ready.weights[l][j].length; i++) {
          const plus = lossWithMutation(init, (s) => ({
            ...s,
            weights: s.weights.map((W, lx) =>
              lx !== l
                ? W
                : W.map((row, jx) =>
                    jx !== j
                      ? row
                      : row.map((v, ix) => (ix === i ? v + eps : v)),
                  ),
            ),
          }));
          const minus = lossWithMutation(init, (s) => ({
            ...s,
            weights: s.weights.map((W, lx) =>
              lx !== l
                ? W
                : W.map((row, jx) =>
                    jx !== j
                      ? row
                      : row.map((v, ix) => (ix === i ? v - eps : v)),
                  ),
            ),
          }));
          const numeric = (plus - minus) / (2 * eps);
          expect(gradients[l][j][i]).toBeCloseTo(numeric, 4);
        }
      }
    }
  });

  it("bias gradients match central finite differences", () => {
    const config = miniConfig();
    const init = nnEngine.init(config);
    const ready = runForward(init);
    const { biasGradients } = computeBackprop(ready);
    const eps = 1e-5;

    for (let l = 0; l < ready.biases.length; l++) {
      for (let j = 0; j < ready.biases[l].length; j++) {
        const plus = lossWithMutation(init, (s) => ({
          ...s,
          biases: s.biases.map((b, lx) =>
            lx !== l ? b : b.map((v, jx) => (jx === j ? v + eps : v)),
          ),
        }));
        const minus = lossWithMutation(init, (s) => ({
          ...s,
          biases: s.biases.map((b, lx) =>
            lx !== l ? b : b.map((v, jx) => (jx === j ? v - eps : v)),
          ),
        }));
        const numeric = (plus - minus) / (2 * eps);
        expect(biasGradients[l][j]).toBeCloseTo(numeric, 4);
      }
    }
  });

  it("also works for a deeper network with sigmoid activations", () => {
    const config = miniConfig({
      layers: [2, 3, 3, 1],
      activations: ["sigmoid", "sigmoid", "linear"],
      dataset: [{ x: [0.3, -0.6], y: 0.8 }],
      seed: 77,
    });
    const init = nnEngine.init(config);
    const ready = runForward(init);
    const { gradients } = computeBackprop(ready);
    const eps = 1e-5;

    for (let l = 0; l < ready.weights.length; l++) {
      for (let j = 0; j < ready.weights[l].length; j++) {
        for (let i = 0; i < ready.weights[l][j].length; i++) {
          const plus = lossWithMutation(init, (s) => ({
            ...s,
            weights: s.weights.map((W, lx) =>
              lx !== l
                ? W
                : W.map((row, jx) =>
                    jx !== j
                      ? row
                      : row.map((v, ix) => (ix === i ? v + eps : v)),
                  ),
            ),
          }));
          const minus = lossWithMutation(init, (s) => ({
            ...s,
            weights: s.weights.map((W, lx) =>
              lx !== l
                ? W
                : W.map((row, jx) =>
                    jx !== j
                      ? row
                      : row.map((v, ix) => (ix === i ? v - eps : v)),
                  ),
            ),
          }));
          const numeric = (plus - minus) / (2 * eps);
          expect(gradients[l][j][i]).toBeCloseTo(numeric, 4);
        }
      }
    }
  });
});

describe("SGD convergence — sanity", () => {
  it("reduces the loss on a small fixed dataset after many epochs", () => {
    const config = miniConfig({
      dataset: [
        { x: [0.1, 0.2, 0.3], y: 0.4 },
        { x: [0.6, -0.1, 0.2], y: 0.7 },
        { x: [-0.3, 0.4, 0.1], y: 0.1 },
        { x: [0.9, 0.0, -0.4], y: 0.8 },
      ],
      learningRate: 0.1,
      layers: [3, 8, 1],
      activations: ["tanh", "linear"],
      seed: 1,
    });
    let s = nnEngine.init(config);
    for (let epoch = 0; epoch < 200; epoch++) {
      for (let sample = 0; sample < config.dataset.length; sample++) {
        for (let p = 0; p < 7; p++) s = nnEngine.step(s).state;
      }
    }
    expect(s.lossHistory.length).toBe(200);
    expect(s.lossHistory[s.lossHistory.length - 1]).toBeLessThan(
      s.lossHistory[0] * 0.25,
    );
  });
});
