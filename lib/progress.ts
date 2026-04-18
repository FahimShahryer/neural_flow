/**
 * Progress tracking via localStorage. Fleshed out in step 10.
 * Kept under lib/ so it remains engine-agnostic and reusable across every future module.
 */

const STORAGE_KEY = "neuralflow:progress:v1";

export type Progress = {
  completedLessons: string[]; // "nn/01-what-is-a-neuron"
  lastVisited?: string;
};

export function loadProgress(): Progress {
  if (typeof window === "undefined") return { completedLessons: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Progress) : { completedLessons: [] };
  } catch {
    return { completedLessons: [] };
  }
}

export function saveProgress(next: Progress): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
