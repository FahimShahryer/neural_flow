/**
 * Public surface of the NN engine — the shell and lessons import from here.
 */

export { nnEngine, NN_PHASES } from "./engine";
export { generateHouseDataset, SIZE_MIN, SIZE_MAX, BEDS_MIN, BEDS_MAX } from "./dataset";
export type {
  ActivationKind,
  Sample,
  NNConfig,
  NNState,
  NNPhaseId,
  NNEventDetail,
} from "./types";
export type { HouseSampleMeta } from "./dataset";

import { nnEngine } from "./engine";
import { generateHouseDataset } from "./dataset";
import type { NNConfig } from "./types";

/**
 * A reasonable default config for the house-price teaching story.
 * Consumers can override any field via applyConfig.
 */
export function defaultNNConfig(overrides: Partial<NNConfig> = {}): NNConfig {
  const { samples } = generateHouseDataset(overrides.dataset?.length ?? 200, overrides.seed ?? 42);
  return {
    layers: [3, 4, 1],
    activations: ["relu", "linear"],
    seed: 42,
    dataset: samples,
    ...overrides,
  };
}

/** Convenience: init the engine with the default config. */
export function initDefaultNN() {
  return nnEngine.init(defaultNNConfig());
}
