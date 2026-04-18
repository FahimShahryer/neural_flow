/**
 * Curriculum — single source of truth for every module and lesson.
 *
 * Adding a new lesson = add an entry here and drop a matching .mdx file at
 * content/<module>/<slug>.mdx. The sidebar nav, the lesson route, and the
 * "next lesson" hint all read from this file. No other place to update.
 */

export type Lesson = {
  slug: string;
  title: string;
  order: number;
  summary: string;
  /** False until the lesson's .mdx file exists and is ready. Locked in the UI. */
  built: boolean;
};

export type Module = {
  slug: string;
  name: string;
  tagline: string;
  lessons: Lesson[];
};

export const MODULES: Module[] = [
  {
    slug: "nn",
    name: "Neural Networks",
    tagline:
      "From a single neuron to a fully trained model. Every concept interactive.",
    lessons: [
      {
        slug: "01-what-is-a-neuron",
        title: "What is a neuron?",
        order: 1,
        summary:
          "The smallest unit of a network — a weighted sum, a bias, and an activation function.",
        built: true,
      },
      {
        slug: "02-layers",
        title: "What is a layer?",
        order: 2,
        summary: "Stack neurons side-by-side and see why that unlocks everything.",
        built: false,
      },
      {
        slug: "03-forward-pass",
        title: "Forward pass",
        order: 3,
        summary: "Watch data flow left-to-right through the network.",
        built: false,
      },
      {
        slug: "04-activations",
        title: "Activation functions",
        order: 4,
        summary: "ReLU, Sigmoid, Tanh — and why each one exists.",
        built: false,
      },
      {
        slug: "05-prediction-vs-reality",
        title: "Prediction vs. reality",
        order: 5,
        summary: "The gap between what the model says and what's true — the error.",
        built: false,
      },
      {
        slug: "06-loss",
        title: "Loss function",
        order: 6,
        summary: "Measuring the error, and the curve we're trying to descend.",
        built: false,
      },
      {
        slug: "07-backprop",
        title: "Backpropagation",
        order: 7,
        summary: "Error flows backward. Every weight gets a blame score.",
        built: false,
      },
      {
        slug: "08-gradient-descent",
        title: "Gradient descent",
        order: 8,
        summary: "Adjust weights to reduce loss. Watch it happen in real time.",
        built: false,
      },
      {
        slug: "09-training-loop",
        title: "The training loop",
        order: 9,
        summary: "Run forward, backward, update — hundreds of times. Loss drops.",
        built: false,
      },
      {
        slug: "10-overfitting",
        title: "Overfitting",
        order: 10,
        summary:
          "Too many layers, too little data. Train loss perfect, test loss terrible.",
        built: false,
      },
    ],
  },
];

export function getModule(slug: string): Module | undefined {
  return MODULES.find((m) => m.slug === slug);
}

export function getLesson(
  moduleSlug: string,
  lessonSlug: string,
): { module: Module; lesson: Lesson } | undefined {
  const mod = getModule(moduleSlug);
  if (!mod) return undefined;
  const lesson = mod.lessons.find((l) => l.slug === lessonSlug);
  if (!lesson) return undefined;
  return { module: mod, lesson };
}

export function getNextLesson(
  moduleSlug: string,
  lessonSlug: string,
): { module: string; lesson: Lesson } | undefined {
  const mod = getModule(moduleSlug);
  if (!mod) return undefined;
  const idx = mod.lessons.findIndex((l) => l.slug === lessonSlug);
  if (idx < 0 || idx === mod.lessons.length - 1) return undefined;
  return { module: mod.slug, lesson: mod.lessons[idx + 1] };
}

export function getAllBuiltLessons(): { module: string; lesson: string }[] {
  return MODULES.flatMap((m) =>
    m.lessons.filter((l) => l.built).map((l) => ({ module: m.slug, lesson: l.slug })),
  );
}
