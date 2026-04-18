/**
 * Tiny, hand-rolled math for the NN engine.
 *
 * Every operation is a few lines. No Float32Array, no tensor library. The
 * whole point of hand-rolling is that the learner clicking a weight sees the
 * same number the engine just multiplied — there is no "framework magic"
 * hiding between what they see and what runs.
 */

import type { ActivationKind } from "./types";

/** Seeded mulberry32 PRNG — small, deterministic, good enough for weight init. */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return function rng() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function activate(z: number, kind: ActivationKind): number {
  switch (kind) {
    case "linear":
      return z;
    case "relu":
      return z > 0 ? z : 0;
    case "sigmoid":
      return 1 / (1 + Math.exp(-z));
    case "tanh":
      return Math.tanh(z);
  }
}

/** Derivative of the activation w.r.t. its pre-activation z. Used for backprop in step 6. */
export function activateDeriv(z: number, kind: ActivationKind): number {
  switch (kind) {
    case "linear":
      return 1;
    case "relu":
      return z > 0 ? 1 : 0;
    case "sigmoid": {
      const s = 1 / (1 + Math.exp(-z));
      return s * (1 - s);
    }
    case "tanh": {
      const t = Math.tanh(z);
      return 1 - t * t;
    }
  }
}

/** Compute the pre-activation z = W·x + b for one layer. */
export function denseZ(weights: number[][], biases: number[], input: number[]): number[] {
  const out = new Array<number>(weights.length);
  for (let j = 0; j < weights.length; j++) {
    const row = weights[j];
    let s = biases[j];
    for (let i = 0; i < row.length; i++) s += row[i] * input[i];
    out[j] = s;
  }
  return out;
}

/** Apply an elementwise activation function to a vector. */
export function applyActivation(z: number[], kind: ActivationKind): number[] {
  const out = new Array<number>(z.length);
  for (let i = 0; i < z.length; i++) out[i] = activate(z[i], kind);
  return out;
}

/**
 * He-scaled uniform init. Good for ReLU networks; fine for others at this scale.
 * Returns weights shaped [out][in].
 */
export function initWeightMatrix(
  outSize: number,
  inSize: number,
  rng: () => number,
): number[][] {
  const scale = Math.sqrt(2 / Math.max(1, inSize));
  const out: number[][] = [];
  for (let j = 0; j < outSize; j++) {
    const row: number[] = [];
    for (let i = 0; i < inSize; i++) row.push((rng() * 2 - 1) * scale);
    out.push(row);
  }
  return out;
}
