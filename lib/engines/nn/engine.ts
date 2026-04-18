/**
 * Neural Network engine — full training loop.
 *
 * Each step() advances exactly one teaching phase so a learner in "slow mode"
 * can watch forward, loss, backward, and weight update as distinct moments.
 *
 * Phase cycle, one sample:
 *   idle → input → forward → predict → loss → backward → update → idle …
 *
 * At the wrap-around (last sample's 'update' → idle), the epoch average loss
 * is appended to state.lossHistory and epochCount is incremented.
 */

import type { SimEngine, SimEvent, SimPhase } from "@/lib/engine-contract";
import type { NNConfig, NNEventDetail, NNPhaseId, NNState } from "./types";
import {
  applyActivation,
  denseZ,
  initWeightMatrix,
  makeRng,
} from "./math";
import { computeSampleLoss } from "./loss";
import { applySGD, computeBackprop } from "./backprop";

export const NN_PHASES: readonly SimPhase[] = [
  { id: "idle", label: "Idle", hint: "Waiting for the next step." },
  { id: "input", label: "Input", hint: "A training sample is placed on the input layer." },
  { id: "forward", label: "Forward pass", hint: "Each layer computes its activations from the previous one." },
  { id: "predict", label: "Prediction", hint: "The output layer's value is the model's prediction." },
  { id: "loss", label: "Loss", hint: "How far off the prediction was from the true label." },
  { id: "backward", label: "Backprop", hint: "Error flows backward. Each weight gets a gradient." },
  { id: "update", label: "Weight update", hint: "Weights step in the direction that reduces loss." },
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
  if (config.layers[config.layers.length - 1] !== 1) {
    throw new Error("Scalar regression only for now — output layer must have size 1.");
  }
  if (config.learningRate <= 0 || !Number.isFinite(config.learningRate)) {
    throw new Error(`learningRate must be a positive finite number (got ${config.learningRate}).`);
  }
}

function emptyNestedArray(lengths: number[]): number[][] {
  return lengths.map((n) => new Array<number>(n).fill(0));
}

function emptyPreActivations(config: NNConfig): number[][] {
  return config.layers.slice(1).map((n) => new Array<number>(n).fill(0));
}

function emptyGradients(config: NNConfig): number[][][] {
  const out: number[][][] = [];
  for (let l = 0; l < config.layers.length - 1; l++) {
    const outSize = config.layers[l + 1];
    const inSize = config.layers[l];
    out.push(
      Array.from({ length: outSize }, () => new Array<number>(inSize).fill(0)),
    );
  }
  return out;
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
  const [kind, ...rest] = id.split(":");
  if (kind !== "neuron" && kind !== "weight" && kind !== "bias") return null;
  const parts = rest.map((p) => Number(p));
  if (parts.some((p) => !Number.isInteger(p) || p < 0)) return null;
  const expected = kind === "weight" ? 3 : 2;
  if (parts.length !== expected) return null;
  return { kind, parts };
}

function fmtVec(v: number[], n = 3, digits = 2): string {
  const head = v
    .slice(0, n)
    .map((x) => x.toFixed(digits))
    .join(", ");
  return v.length > n ? `${head}, …` : head;
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
      sampleLoss: null,
      gradients: emptyGradients(config),
      biasGradients: emptyPreActivations(config),
      preActivationGradients: emptyPreActivations(config),
      currentEpochLossSum: 0,
      samplesSeenInEpoch: 0,
      epochCount: 0,
      lossHistory: [],
    };
  },

  step(state: NNState): {
    state: NNState;
    event: SimEvent<NNPhaseId, NNEventDetail>;
  } {
    switch (state.phase) {
      case "idle": {
        const sampleIndex = state.sampleIndex;
        const sample = state.config.dataset[sampleIndex];
        const activations = [
          sample.x.slice(),
          ...emptyNestedArray(state.config.layers.slice(1)),
        ];
        const next: NNState = {
          ...state,
          phase: "input",
          activations,
          preActivations: emptyPreActivations(state.config),
          prediction: null,
          sampleLoss: null,
        };
        return {
          state: next,
          event: {
            phase: "input",
            summary: `Loaded sample #${sampleIndex + 1} onto the input layer: [${fmtVec(sample.x)}].`,
            detail: { sampleIndex, input: sample.x.slice() },
          },
        };
      }

      case "input": {
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
            summary: `Forward pass complete. Output activations: [${fmtVec(activations[activations.length - 1])}].`,
            detail: {
              activations: activations.map((a) => a.slice()),
              preActivations: preActivations.map((z) => z.slice()),
            },
          },
        };
      }

      case "forward": {
        const prediction = state.activations[state.activations.length - 1][0];
        const actual = state.config.dataset[state.sampleIndex].y;
        const next: NNState = { ...state, phase: "predict", prediction };
        return {
          state: next,
          event: {
            phase: "predict",
            summary: `Prediction = ${prediction.toFixed(3)} (actual = ${actual.toFixed(3)}).`,
            detail: { prediction, actual },
          },
        };
      }

      case "predict": {
        const sampleLoss = computeSampleLoss(state);
        const actual = state.config.dataset[state.sampleIndex].y;
        const pred = state.prediction ?? 0;
        const next: NNState = { ...state, phase: "loss", sampleLoss };
        return {
          state: next,
          event: {
            phase: "loss",
            summary: `Loss = (pred − actual)² = (${pred.toFixed(3)} − ${actual.toFixed(3)})² = ${sampleLoss.toFixed(4)}.`,
            detail: { sampleLoss, prediction: pred, actual },
          },
        };
      }

      case "loss": {
        const { gradients, biasGradients, preActivationGradients } =
          computeBackprop(state);
        const next: NNState = {
          ...state,
          phase: "backward",
          gradients,
          biasGradients,
          preActivationGradients,
        };
        return {
          state: next,
          event: {
            phase: "backward",
            summary: `Gradients computed. δ (output) = ${preActivationGradients[preActivationGradients.length - 1][0].toFixed(4)}.`,
            detail: { gradients, biasGradients, preActivationGradients },
          },
        };
      }

      case "backward": {
        const lr = state.config.learningRate;
        const { weights, biases } = applySGD(
          state.weights,
          state.biases,
          state.gradients,
          state.biasGradients,
          lr,
        );
        const nextSampleIndex =
          (state.sampleIndex + 1) % state.config.dataset.length;
        const wrapped = nextSampleIndex === 0;
        const lossToAdd = state.sampleLoss ?? 0;
        const newSum = state.currentEpochLossSum + lossToAdd;
        const lossHistory = wrapped
          ? [...state.lossHistory, newSum / state.config.dataset.length]
          : state.lossHistory;
        const epochCount = wrapped ? state.epochCount + 1 : state.epochCount;
        const currentEpochLossSum = wrapped ? 0 : newSum;
        const samplesSeenInEpoch = wrapped ? 0 : state.samplesSeenInEpoch + 1;

        const next: NNState = {
          ...state,
          phase: "update",
          weights,
          biases,
          sampleIndex: nextSampleIndex,
          currentEpochLossSum,
          samplesSeenInEpoch,
          epochCount,
          lossHistory,
        };

        const summary = wrapped
          ? `Weights updated with lr=${lr}. Epoch ${epochCount} avg loss: ${lossHistory[lossHistory.length - 1].toFixed(4)}.`
          : `Weights updated with lr=${lr}. Next sample ready.`;

        return {
          state: next,
          event: {
            phase: "update",
            summary,
            detail: {
              learningRate: lr,
              epochCount,
              lossHistory,
            },
          },
        };
      }

      case "update": {
        const next: NNState = { ...state, phase: "idle" };
        return {
          state: next,
          event: {
            phase: "idle",
            summary: `Ready for sample #${state.sampleIndex + 1}.`,
            detail: { sampleIndex: state.sampleIndex },
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
      case "loss":
        return "We measure how wrong the prediction was using a loss function. For regression, MSE squares the error — large misses are punished disproportionately, which is why the network cares more about being very wrong than slightly wrong.";
      case "backward":
        return "Error flows backward through the network. Each weight receives a gradient — a number telling it which direction and how much to move to reduce the loss. This is where the word 'learning' lives.";
      case "update":
        return "Every weight and bias shifts by a small step in the direction of its negative gradient, scaled by the learning rate. If the learning rate is too large the model overshoots; too small and it barely moves.";
    }
  },
};
