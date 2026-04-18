/**
 * Backpropagation for the NN engine.
 *
 * Assumes the engine has already run a forward pass: activations and
 * preActivations are populated, and config.dataset[state.sampleIndex] is the
 * current example. Returns fresh gradient arrays — does not mutate state.
 *
 * Scope: scalar-target regression (output layer size 1).
 */

import { activateDeriv } from "./math";
import { lossDerivForPred } from "./loss";
import type { NNState } from "./types";

export type BackpropResult = {
  gradients: number[][][]; // shape matches state.weights
  biasGradients: number[][]; // shape matches state.biases
  /** δ[l] = ∂L/∂z[l+1] — one entry per non-input layer, same shape as preActivations. */
  preActivationGradients: number[][];
};

export function computeBackprop(state: NNState): BackpropResult {
  const { config, weights, activations, preActivations } = state;
  const L = config.layers.length - 1; // index of the output layer
  const sample = config.dataset[state.sampleIndex];

  if (activations.length !== L + 1) {
    throw new Error("computeBackprop: activations not populated (no forward pass?)");
  }

  // Scalar regression: pull out a single prediction.
  const pred = activations[L][0];
  const dLoss_dPred = lossDerivForPred(pred, sample.y, config.lossKind);

  // δ for the output layer's pre-activation (preActivations[L-1]).
  const outActFn = config.activations[L - 1];
  const zOut = preActivations[L - 1];
  const deltaOut: number[] = new Array(zOut.length).fill(0);
  deltaOut[0] = dLoss_dPred * activateDeriv(zOut[0], outActFn);

  // Allocate δ array — one entry per non-input layer, ordered by layer index
  // (so preActivationGradients[l] corresponds to preActivations[l]).
  const deltas: number[][] = new Array(L);
  deltas[L - 1] = deltaOut;

  // Walk backward: for l = L-1 down to 1, compute δ for preActivations[l-1].
  for (let l = L - 1; l >= 1; l--) {
    const nextDelta = deltas[l]; // δ for preActivations[l], shape [layers[l+1]]
    const W = weights[l]; // shape [layers[l+1]][layers[l]]
    const zPrev = preActivations[l - 1]; // z for layer l, shape [layers[l]]
    const prevActFn = config.activations[l - 1];

    const prevDelta: number[] = new Array(zPrev.length).fill(0);
    for (let i = 0; i < zPrev.length; i++) {
      let sum = 0;
      for (let j = 0; j < W.length; j++) {
        sum += W[j][i] * nextDelta[j];
      }
      prevDelta[i] = sum * activateDeriv(zPrev[i], prevActFn);
    }
    deltas[l - 1] = prevDelta;
  }

  // Build gradW[l] = δ[l] ⊗ a[l] (outer product) and gradB[l] = δ[l].
  const gradients: number[][][] = [];
  const biasGradients: number[][] = [];
  for (let l = 0; l < L; l++) {
    const delta = deltas[l]; // shape [layers[l+1]]
    const aPrev = activations[l]; // shape [layers[l]]
    const gradW: number[][] = [];
    for (let j = 0; j < delta.length; j++) {
      const row: number[] = new Array(aPrev.length);
      for (let i = 0; i < aPrev.length; i++) {
        row[i] = delta[j] * aPrev[i];
      }
      gradW.push(row);
    }
    gradients.push(gradW);
    biasGradients.push(delta.slice());
  }

  return { gradients, biasGradients, preActivationGradients: deltas };
}

/** Apply SGD: W ← W − lr · ∇W, b ← b − lr · ∇b. Returns fresh arrays. */
export function applySGD(
  weights: number[][][],
  biases: number[][],
  gradW: number[][][],
  gradB: number[][],
  learningRate: number,
): { weights: number[][][]; biases: number[][] } {
  const newWeights = weights.map((W, l) =>
    W.map((row, j) => row.map((w, i) => w - learningRate * gradW[l][j][i])),
  );
  const newBiases = biases.map((b, l) =>
    b.map((v, j) => v - learningRate * gradB[l][j]),
  );
  return { weights: newWeights, biases: newBiases };
}
