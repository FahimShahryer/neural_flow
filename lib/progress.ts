"use client";

import { useEffect, useState } from "react";

/**
 * Progress tracking via localStorage — engine-agnostic.
 *
 * A lesson id is the conventional "<module>/<slug>" string, e.g.
 * "nn/01-what-is-a-neuron". This lets progress span any future module
 * without a schema change.
 */

const STORAGE_KEY = "neuralflow:progress:v1";

export type Progress = {
  completedLessons: string[];
  lastVisited?: string;
};

const EMPTY: Progress = { completedLessons: [] };

export function loadProgress(): Progress {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Progress;
    if (!Array.isArray(parsed.completedLessons)) return EMPTY;
    return parsed;
  } catch {
    return EMPTY;
  }
}

export function saveProgress(next: Progress): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("neuralflow:progress-changed"));
  } catch {
    /* storage may be disabled — fail silently */
  }
}

export function lessonId(moduleSlug: string, lessonSlug: string): string {
  return `${moduleSlug}/${lessonSlug}`;
}

export function markLessonComplete(
  moduleSlug: string,
  lessonSlug: string,
): void {
  const id = lessonId(moduleSlug, lessonSlug);
  const current = loadProgress();
  if (current.completedLessons.includes(id)) {
    saveProgress({ ...current, lastVisited: id });
    return;
  }
  saveProgress({
    completedLessons: [...current.completedLessons, id],
    lastVisited: id,
  });
}

export function clearProgress(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("neuralflow:progress-changed"));
}

/**
 * React hook — returns the current progress and re-renders when it changes
 * (from this tab, other tabs via storage event, or direct calls). Safe to
 * call in Client Components rendered during SSR: the first render returns
 * the empty default; an effect hydrates real state after mount.
 */
export function useProgress(): Progress {
  const [progress, setProgress] = useState<Progress>(EMPTY);

  useEffect(() => {
    setProgress(loadProgress());
    const update = () => setProgress(loadProgress());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) update();
    };
    window.addEventListener("neuralflow:progress-changed", update);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("neuralflow:progress-changed", update);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return progress;
}
