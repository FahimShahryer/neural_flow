"use client";

import { createSimStore } from "@/lib/sim-store";
import { nnEngine, defaultNNConfig } from "@/lib/engines/nn";

/**
 * Module-level NN sim store for the house-price demo.
 * Components use granular selectors on this store via `useNNSim(s => s.x)`.
 */
export const useNNSim = createSimStore(nnEngine, defaultNNConfig());
