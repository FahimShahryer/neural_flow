import { notFound } from "next/navigation";
import { LessonShell } from "@/components/lesson/LessonShell";

type LessonParams = { module: string; lesson: string };

// Known modules. New modules are added by creating a folder under content/<module>/
// and registering it here. Modular by construction: no framework change needed.
const MODULES = ["nn"] as const;

// Known lessons per module. In step 10 we'll replace this with fs-driven discovery,
// but for the foundation we keep it explicit so static generation is predictable.
const LESSONS: Record<(typeof MODULES)[number], string[]> = {
  nn: ["01-what-is-a-neuron"],
};

export function generateStaticParams(): LessonParams[] {
  return MODULES.flatMap((m) =>
    LESSONS[m].map((lesson) => ({ module: m, lesson })),
  );
}

export const dynamicParams = false;

export default async function LessonPage({
  params,
}: {
  params: Promise<LessonParams>;
}) {
  const { module: moduleSlug, lesson } = await params;

  if (!MODULES.includes(moduleSlug as (typeof MODULES)[number])) notFound();
  if (!LESSONS[moduleSlug as (typeof MODULES)[number]].includes(lesson))
    notFound();

  const mod = (await import(`@/content/${moduleSlug}/${lesson}.mdx`)) as {
    default: React.ComponentType;
    metadata?: { title?: string };
  };
  const Lesson = mod.default;

  return (
    <LessonShell
      module={moduleSlug}
      slug={lesson}
      title={mod.metadata?.title}
    >
      <Lesson />
    </LessonShell>
  );
}
