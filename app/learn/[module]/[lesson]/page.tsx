import { notFound } from "next/navigation";
import { LessonShell } from "@/components/lesson/LessonShell";
import { getAllBuiltLessons, getLesson } from "@/lib/curriculum";

type LessonParams = { module: string; lesson: string };

export function generateStaticParams(): LessonParams[] {
  return getAllBuiltLessons();
}

export const dynamicParams = false;

export default async function LessonPage({
  params,
}: {
  params: Promise<LessonParams>;
}) {
  const { module: moduleSlug, lesson: lessonSlug } = await params;

  const resolved = getLesson(moduleSlug, lessonSlug);
  if (!resolved || !resolved.lesson.built) notFound();

  const mod = (await import(`@/content/${moduleSlug}/${lessonSlug}.mdx`)) as {
    default: React.ComponentType;
  };
  const Lesson = mod.default;

  return (
    <LessonShell
      module={moduleSlug}
      slug={lessonSlug}
      title={resolved.lesson.title}
    >
      <Lesson />
    </LessonShell>
  );
}
