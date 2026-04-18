/**
 * The NeuralFlow teaching dataset — house prices from 3 features.
 *
 * All normalized into [0, 1]-ish ranges so the network's math doesn't need to
 * juggle big numbers. The UI re-denormalizes for display ("1,800 sqft →
 * $275k").
 */

import type { Sample } from "./types";
import { makeRng } from "./math";

export const SIZE_MIN = 500;
export const SIZE_MAX = 3500;
export const BEDS_MIN = 1;
export const BEDS_MAX = 5;

/**
 * A synthetic "true" pricing function used to generate labels. The point is
 * to produce examples with a learnable pattern plus a little noise, so the
 * training dynamics are visible but not random.
 *
 * All inputs here are already normalized to [0, 1].
 */
function trueValue(sizeN: number, bedsN: number, locN: number, noise: number): number {
  const base = 0.55 * sizeN + 0.2 * bedsN + 0.3 * locN;
  return Math.max(0, Math.min(1.2, base + noise));
}

export type HouseSampleMeta = {
  sizeSqft: number;
  bedrooms: number;
  locationScore: number;
  priceK: number;
};

export function generateHouseDataset(
  n: number,
  seed: number,
): { samples: Sample[]; meta: HouseSampleMeta[] } {
  const rng = makeRng(seed);
  const samples: Sample[] = [];
  const meta: HouseSampleMeta[] = [];
  for (let i = 0; i < n; i++) {
    const sizeSqft = SIZE_MIN + rng() * (SIZE_MAX - SIZE_MIN);
    const bedrooms = 1 + Math.floor(rng() * 5);
    const locationScore = rng();
    const sizeN = (sizeSqft - SIZE_MIN) / (SIZE_MAX - SIZE_MIN);
    const bedsN = (bedrooms - BEDS_MIN) / (BEDS_MAX - BEDS_MIN);
    const noise = (rng() - 0.5) * 0.08;
    const y = trueValue(sizeN, bedsN, locationScore, noise);
    samples.push({ x: [sizeN, bedsN, locationScore], y });
    meta.push({
      sizeSqft: Math.round(sizeSqft),
      bedrooms,
      locationScore,
      priceK: Math.round(y * 500),
    });
  }
  return { samples, meta };
}
