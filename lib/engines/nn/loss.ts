/**
 * Loss functions for the NN engine.
 *
 * All functions are scalar-target for now (single output neuron).
 * Multi-output / cross-entropy lands when we add classification in a future module.
 */

import type { LossKind, NNState } from "./types";

/** Compute loss for the current sample using the prediction already on state. */
export function computeSampleLoss(state: NNState): number {
  const sample = state.config.dataset[state.sampleIndex];
  const predArray = state.activations[state.activations.length - 1];
  const pred = predArray[0] ?? state.prediction ?? 0;
  return lossFor(pred, sample.y, state.config.lossKind);
}

/** Loss for a single scalar prediction vs a scalar target. */
export function lossFor(pred: number, y: number, kind: LossKind): number {
  switch (kind) {
    case "mse": {
      const err = pred - y;
      return err * err;
    }
  }
}

/** Derivative of the loss w.r.t. the scalar prediction. */
export function lossDerivForPred(pred: number, y: number, kind: LossKind): number {
  switch (kind) {
    case "mse":
      return 2 * (pred - y);
  }
}
