"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { markLessonComplete } from "@/lib/progress";
import { getLesson, getNextLesson } from "@/lib/curriculum";

type Props = {
  module: string;
  slug: string;
};

/**
 * "Done — next lesson" button. Marks the current lesson complete in
 * localStorage and navigates to the next built lesson. If the next
 * lesson isn't built yet, renders a "Coming soon" state.
 */
export function NextLessonButton({ module, slug }: Props) {
  const router = useRouter();
  const current = getLesson(module, slug);
  const next = getNextLesson(module, slug);
  if (!current) return null;

  const onFinish = () => {
    markLessonComplete(module, slug);
    if (next?.lesson.built) {
      router.push(`/learn/${next.module}/${next.lesson.slug}`);
    }
  };

  return (
    <div className="not-prose my-10 rounded-xl border border-border/70 bg-card/40 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Check className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">
              Ready to move on?
            </div>
            <div className="text-xs text-muted-foreground">
              Mark this lesson complete and continue.
            </div>
          </div>
        </div>

        {next ? (
          next.lesson.built ? (
            <button
              type="button"
              onClick={onFinish}
              className="group inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Next: {next.lesson.title}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          ) : (
            <div className="flex flex-col items-end gap-1">
              <button
                type="button"
                onClick={onFinish}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background"
              >
                Mark complete
                <Check className="h-4 w-4" />
              </button>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                next up — {next.lesson.title} · coming soon
              </span>
            </div>
          )
        ) : (
          <div className="inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-4 w-4" />
            <span>You've finished the module!</span>
          </div>
        )}
      </div>

      {next?.lesson.built ? (
        <div className="mt-4 flex items-start gap-3 rounded-md border border-border/60 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
          <Link
            href={`/learn/${next.module}/${next.lesson.slug}`}
            className="font-medium text-foreground hover:underline"
          >
            {next.lesson.title}
          </Link>
          <span>· {next.lesson.summary}</span>
        </div>
      ) : null}
    </div>
  );
}
