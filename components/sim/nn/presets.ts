/**
 * Dramatic demo presets for the NN engine.
 *
 * Each preset is a partial config override + a set of narration hooks the
 * lesson UI calls to show "what's happening and why" while the preset runs.
 * These are the 5 canonical teaching moments from NeuralFlow_Vision.docx §4.4.
 */

import type { NNConfig, NNState, ActivationKind } from "@/lib/engines/nn";
import { generateHouseDataset } from "@/lib/engines/nn";

export type PresetKey =
  | "explosion"
  | "crawl"
  | "overfit"
  | "dead-neuron"
  | "vanishing-gradient";

export type DramaticPreset = {
  key: PresetKey;
  emoji: string;
  name: string;
  /** One-line pitch shown on the preset button. */
  tagline: string;
  /** The hook — what's about to happen. Shown in the banner. */
  headline: string;
  /** Overrides merged into the current config. */
  config: Partial<NNConfig>;
  /** Where to set the playback speed once the preset is loaded (ms per step). */
  preferredSpeedMs?: number;
  /**
   * Live narration based on the current state. Called every time state
   * updates. Returns a short explanation (what you're seeing, why). Shorter
   * is better — this is always on-screen.
   */
  narrate: (state: NNState) => string;
};

const tinyDataset = generateHouseDataset(4, 101).samples;

export const PRESETS: DramaticPreset[] = [
  {
    key: "explosion",
    emoji: "💥",
    name: "The Explosion",
    tagline: "LR too high — loss diverges",
    headline:
      "Learning rate cranked to 2.0. Watch the loss curve rocket upward instead of down.",
    config: { learningRate: 2.0 },
    preferredSpeedMs: 200,
    narrate: (state) => {
      const hist = state.lossHistory;
      if (hist.length === 0)
        return "Press Play. With LR = 2.0, each SGD step moves the weights too far. The loss won't go down — it'll explode.";
      const latest = hist[hist.length - 1];
      if (!Number.isFinite(latest) || latest > 1e6)
        return `Loss has overflowed — weights are shooting off to infinity. This is what happens when the learning rate is far too large.`;
      if (latest > 100)
        return `Epoch loss is ${latest.toFixed(1)}, climbing. Each weight update overshoots the target, making the next update even worse.`;
      return `Loss is rising fast. Large LR = weights overshoot = next step is wider off = larger gradients = even bigger overshoot.`;
    },
  },
  {
    key: "crawl",
    emoji: "🐢",
    name: "The Crawl",
    tagline: "LR too low — nothing moves",
    headline:
      "Learning rate crushed to 0.0005. Technically training, practically frozen.",
    config: { learningRate: 0.0005 },
    preferredSpeedMs: 120,
    narrate: (state) => {
      const hist = state.lossHistory;
      if (hist.length < 3)
        return "Press Play and wait. LR = 0.0005 is tiny — each step barely nudges any weight.";
      const latest = hist[hist.length - 1];
      const first = hist[0];
      const change = Math.abs(latest - first) / Math.max(first, 1e-9);
      if (change < 0.01)
        return `After ${hist.length} epochs, the loss has moved by ${(change * 100).toFixed(2)}%. Too-small learning rates waste training time without ever converging.`;
      return `Loss dripping down. This is what "too cautious" looks like — you'd need thousands of epochs to see real progress.`;
    },
  },
  {
    key: "overfit",
    emoji: "🧠",
    name: "The Overfit",
    tagline: "Huge network, tiny data",
    headline:
      "A deep network meets 4 training examples. Watch it memorize, not learn.",
    config: {
      layers: [3, 20, 20, 20, 1],
      activations: ["relu", "relu", "relu", "linear"],
      learningRate: 0.1,
      dataset: tinyDataset,
      seed: 202,
    },
    preferredSpeedMs: 150,
    narrate: (state) => {
      const hist = state.lossHistory;
      if (hist.length < 5)
        return "60+ hidden neurons, only 4 training samples. There's enough capacity to memorize every example exactly.";
      const latest = hist[hist.length - 1];
      if (latest < 1e-3)
        return `Train loss is ${latest.toExponential(2)} — effectively zero. The network has memorized the 4 examples. Show it a 5th and it'd guess badly: that gap between training and real-world performance is overfitting.`;
      return `Train loss plunging toward zero. With this many parameters and so little data, there's no pressure to generalize.`;
    },
  },
  {
    key: "dead-neuron",
    emoji: "☠️",
    name: "The Dead Neuron",
    tagline: "Wrong output activation",
    headline:
      "Output squashed through sigmoid — but the targets go above 1. The model can never reach them.",
    config: {
      activations: ["relu", "sigmoid"] as ActivationKind[],
      learningRate: 0.1,
    },
    preferredSpeedMs: 150,
    narrate: (state) => {
      const hist = state.lossHistory;
      if (hist.length < 5)
        return "Output activation is sigmoid — output is pinned to (0, 1). But targets go up to ~1.2. The network is trying to reach numbers it can't represent.";
      const latest = hist[hist.length - 1];
      if (hist.length > 20 && latest > 0.02)
        return `Loss has plateaued at ${latest.toFixed(4)} and won't go lower. A wrong output activation caps what the network can learn — no amount of training fixes this.`;
      return `Loss falling, but there's a floor it can't cross. Sigmoid saturates near 1; targets above 1 are unreachable.`;
    },
  },
  {
    key: "vanishing-gradient",
    emoji: "🌫️",
    name: "The Vanishing Gradient",
    tagline: "Deep sigmoid stack",
    headline:
      "Five sigmoid layers in a row. Gradients shrink 4× per layer — early layers barely move.",
    config: {
      layers: [3, 6, 6, 6, 6, 6, 1],
      activations: ["sigmoid", "sigmoid", "sigmoid", "sigmoid", "sigmoid", "linear"] as ActivationKind[],
      learningRate: 0.3,
      seed: 55,
    },
    preferredSpeedMs: 150,
    narrate: (state) => {
      const hist = state.lossHistory;
      if (hist.length < 3)
        return "Six sigmoid layers. Sigmoid's derivative maxes out at 0.25, so gradients lose 75% of their magnitude per layer on the way back.";
      const firstMag = avgAbs(state.gradients[0]);
      const lastMag = avgAbs(state.gradients[state.gradients.length - 1]);
      const ratio = firstMag / Math.max(lastMag, 1e-12);
      if (ratio < 0.01)
        return `First-layer gradients are ${ratio.toExponential(2)}× the output layer's. The layers nearest the input are basically stuck — they can't feel the error signal.`;
      return `Gradients shrink layer by layer as they flow backward. Watch the first layer's weights: they barely change.`;
    },
  },
];

function avgAbs(mat: number[][]): number {
  if (!mat || mat.length === 0) return 0;
  let sum = 0;
  let count = 0;
  for (const row of mat) {
    for (const v of row) {
      sum += Math.abs(v);
      count++;
    }
  }
  return count === 0 ? 0 : sum / count;
}
