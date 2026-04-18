/**
 * Neural Network engine — the first concrete implementation of SimEngine.
 *
 * Scope for step 3: initialization, forward pass, phase-driven stepping.
 * Backprop + weight updates land in step 6. Visualization lands in step 4.
 *
 * The stepping model is deliberately fine-grained for teaching: each call to
 * step() advances exactly one phase, so a learner in "slow mode" can watch
 * input land, forward fire, and the prediction emerge as distinct moments.
 */

import type { SimEngine, SimEvent, SimPhase } from "@/lib/engine-contract";
import type { NNConfig, NNEventDetail, NNPhaseId, NNState } from "./types";
import {
  applyActivation,
  denseZ,
  initWeightMatrix,
  makeRng,
} from "./math";

export const NN_PHASES: readonly SimPhase[] = [
  { id: "idle", label: "Idle", hint: "Waiting for the next step." },
  {
    id: "input",
    label: "Input",
    hint: "A training sample has been placed on the input layer.",
  },
  {
    id: "forward",
    label: "Forward pass",
    hint: "Each layer computed its activations from the previous one.",
  },
  {
    id: "predict",
    label: "Prediction",
    hint: "The output layer's value is the model's prediction.",
  },
] as const;

function validateConfig(config: NNConfig): void {
  if (config.layers.length < 2) {
    throw new Error("NN config must have at least an input and an output layer.");
  }
  if (config.activations.length !== config.layers.length - 1) {
    throw new Error(
      `activations.length (${config.activations.length}) must equal layers.length - 1 (${config.layers.length - 1})`,
    );
  }
  if (config.dataset.length === 0) {
    throw new Error("NN config dataset must not be empty.");
  }
  const expectedInputSize = config.layers[0];
  for (let i = 0; i < config.dataset.length; i++) {
    if (config.dataset[i].x.length !== expectedInputSize) {
      throw new Error(
        `dataset[${i}].x has length ${config.dataset[i].x.length}; expected ${expectedInputSize}`,
      );
    }
  }
}

function emptyNestedArray(lengths: number[]): number[][] {
  return lengths.map((n) => new Array<number>(n).fill(0));
}

function emptyPreActivations(config: NNConfig): number[][] {
  // One entry per non-input layer.
  return config.layers.slice(1).map((n) => new Array<number>(n).fill(0));
}

function initWeightsAndBiases(
  config: NNConfig,
  rng: () => number,
): { weights: number[][][]; biases: number[][] } {
  const weights: number[][][] = [];
  const biases: number[][] = [];
  for (let l = 0; l < config.layers.length - 1; l++) {
    const inSize = config.layers[l];
    const outSize = config.layers[l + 1];
    weights.push(initWeightMatrix(outSize, inSize, rng));
    biases.push(new Array<number>(outSize).fill(0));
  }
  return { weights, biases };
}

function parseInspectId(id: string): {
  kind: "neuron" | "weight" | "bias";
  parts: number[];
} | null {
  // Supported ids:
  //   "neuron:<layer>:<index>"
  //   "weight:<layerPair>:<out>:<in>"    (layerPair is the index into state.weights,
  //                                        0 means between layer 0 and layer 1)
  //   "bias:<layerPair>:<index>"
  const [kind, ...rest] = id.split(":");
  if (kind !== "neuron" && kind !== "weight" && kind !== "bias") return null;
  const parts = rest.map((p) => Number(p));
  if (parts.some((p) => !Number.isInteger(p) || p < 0)) return null;
  const expected = kind === "weight" ? 3 : 2;
  if (parts.length !== expected) return null;
  return { kind, parts };
}

function summarizeInput(state: NNState, sampleIndex: number): string {
  const sample = state.config.dataset[sampleIndex];
  const shown = sample.x
    .slice(0, 3)
    .map((v) => v.toFixed(2))
    .join(", ");
  const ellipsis = sample.x.length > 3 ? ", …" : "";
  return `Loaded sample #${sampleIndex + 1} onto the input layer: [${shown}${ellipsis}].`;
}

function summarizeForward(state: NNState): string {
  const last = state.activations[state.activations.length - 1];
  const shown = last
    .slice(0, 3)
    .map((v) => v.toFixed(3))
    .join(", ");
  const ellipsis = last.length > 3 ? ", …" : "";
  return `Forward pass complete. Output layer activations: [${shown}${ellipsis}].`;
}

function summarizePredict(
  state: NNState,
  prediction: number,
  actual: number,
): string {
  return `Prediction = ${prediction.toFixed(3)} (actual = ${actual.toFixed(3)}).`;
}

export const nnEngine: SimEngine<NNConfig, NNState, NNPhaseId, NNEventDetail> = {
  phases: NN_PHASES,

  init(config: NNConfig): NNState {
    validateConfig(config);
    const rng = makeRng(config.seed);
    const { weights, biases } = initWeightsAndBiases(config, rng);
    return {
      config,
      weights,
      biases,
      sampleIndex: 0,
      phase: "idle",
      activations: emptyNestedArray(config.layers),
      preActivations: emptyPreActivations(config),
      prediction: null,
    };
  },

  step(state: NNState): {
    state: NNState;
    event: SimEvent<NNPhaseId, NNEventDetail>;
  } {
    switch (state.phase) {
      case "idle": {
        // Load the next sample onto the input layer.
        const sampleIndex = state.sampleIndex;
        const sample = state.config.dataset[sampleIndex];
        const activations = [sample.x.slice(), ...emptyNestedArray(state.config.layers.slice(1))];
        const next: NNState = {
          ...state,
          phase: "input",
          activations,
          preActivations: emptyPreActivations(state.config),
          prediction: null,
        };
        return {
          state: next,
          event: {
            phase: "input",
            summary: summarizeInput(next, sampleIndex),
            detail: { sampleIndex, input: sample.x.slice() },
          },
        };
      }

      case "input": {
        // Run the forward pass through every non-input layer.
        const activations: number[][] = [state.activations[0].slice()];
        const preActivations: number[][] = [];
        for (let l = 0; l < state.weights.length; l++) {
          const z = denseZ(state.weights[l], state.biases[l], activations[l]);
          const a = applyActivation(z, state.config.activations[l]);
          preActivations.push(z);
          activations.push(a);
        }
        const next: NNState = {
          ...state,
          phase: "forward",
          activations,
          preActivations,
        };
        return {
          state: next,
          event: {
            phase: "forward",
            summary: summarizeForward(next),
            detail: {
              activations: activations.map((a) => a.slice()),
              preActivations: preActivations.map((z) => z.slice()),
            },
          },
        };
      }

      case "forward": {
        // Read off the prediction from the output layer.
        const outputActivations = state.activations[state.activations.length - 1];
        const prediction = outputActivations[0]; // scalar regression for now
        const actual = state.config.dataset[state.sampleIndex].y;
        const next: NNState = {
          ...state,
          phase: "predict",
          prediction,
        };
        return {
          state: next,
          event: {
            phase: "predict",
            summary: summarizePredict(next, prediction, actual),
            detail: { prediction, actual },
          },
        };
      }

      case "predict": {
        // Advance to the next sample and return to idle so the next step() starts
        // a fresh input phase. (Loss + backprop will intercept here in step 6.)
        const nextSampleIndex =
          (state.sampleIndex + 1) % state.config.dataset.length;
        const next: NNState = {
          ...state,
          sampleIndex: nextSampleIndex,
          phase: "idle",
        };
        return {
          state: next,
          event: {
            phase: "idle",
            summary: `Ready for sample #${nextSampleIndex + 1}.`,
            detail: { sampleIndex: nextSampleIndex },
          },
        };
      }
    }
  },

  reset(state: NNState): NNState {
    return this.init(state.config);
  },

  applyConfig(state: NNState, patch: Partial<NNConfig>): NNState {
    const nextConfig: NNConfig = { ...state.config, ...patch };
    // Any change to topology/seed/dataset invalidates the current weights or
    // the current sample index — safest behaviour is a re-init. Callers who
    // only want to swap, say, an activation function can skip the re-init by
    // not passing a topology change (we preserve weights when the shape is
    // unchanged).
    const topologyChanged =
      patch.layers !== undefined ||
      patch.seed !== undefined ||
      patch.dataset !== undefined;
    if (topologyChanged) return this.init(nextConfig);
    return { ...state, config: nextConfig };
  },

  inspect(state: NNState, id: string): unknown {
    const parsed = parseInspectId(id);
    if (!parsed) return undefined;
    if (parsed.kind === "neuron") {
      const [layer, index] = parsed.parts;
      return state.activations[layer]?.[index];
    }
    if (parsed.kind === "bias") {
      const [layerPair, index] = parsed.parts;
      return state.biases[layerPair]?.[index];
    }
    // weight
    const [layerPair, outIdx, inIdx] = parsed.parts;
    return state.weights[layerPair]?.[outIdx]?.[inIdx];
  },

  explain(
    event: SimEvent<NNPhaseId, NNEventDetail>,
    _state: NNState,
  ): string {
    switch (event.phase) {
      case "idle":
        return "The network is ready for the next training example.";
      case "input":
        return "A training example is placed on the input layer. Each input neuron holds one feature value from this example.";
      case "forward":
        return "Each layer computes its values from the previous layer. For every neuron, we take the weighted sum of the incoming activations, add a bias, and run the result through the activation function. Those new values become the input to the next layer.";
      case "predict":
        return "The output layer's value is the model's prediction for this example. The gap between this prediction and the true label is the model's error — the thing training is trying to shrink.";
    }
  },
};
