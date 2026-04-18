import Link from "next/link";
import { ArrowRight, Target, Sparkles } from "lucide-react";
import { getLesson, getNextLesson } from "@/lib/curriculum";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Props = {
  moduleSlug: string;
  lessonSlug: string;
};

/**
 * Inspector — the right-hand panel. In step 2 it carries lesson context:
 * summary, what's next. In step 7 it becomes engine-aware: click a weight and
 * this panel shows its value, gradient, and history.
 */
export function Inspector({ moduleSlug, lessonSlug }: Props) {
  const current = getLesson(moduleSlug, lessonSlug);
  const next = getNextLesson(moduleSlug, lessonSlug);

  if (!current) return null;

  return (
    <aside
      aria-label="Lesson details"
      className="flex h-full flex-col border-l border-border/60 bg-background"
    >
      <div className="px-5 py-5">
        <div className="flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            In this lesson
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-foreground/90">
          {current.lesson.summary}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wider">
            Lesson {String(current.lesson.order).padStart(2, "0")}
          </Badge>
          <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
            {current.module.name}
          </Badge>
        </div>
      </div>

      <Separator />

      <div className="flex-1 px-5 py-5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Up next
          </div>
        </div>
        {next ? (
          next.lesson.built ? (
            <Link
              href={`/learn/${next.module}/${next.lesson.slug}`}
              className="group mt-3 block rounded-lg border border-border/70 p-3 transition-colors hover:border-foreground/40 hover:bg-accent/40"
            >
              <div className="font-mono text-[10px] tabular-nums text-muted-foreground">
                {String(next.lesson.order).padStart(2, "0")}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-sm font-medium">
                {next.lesson.title}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {next.lesson.summary}
              </p>
            </Link>
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-border/70 p-3 text-muted-foreground">
              <div className="font-mono text-[10px] tabular-nums">
                {String(next.lesson.order).padStart(2, "0")}
              </div>
              <div className="mt-0.5 text-sm font-medium text-foreground/80">
                {next.lesson.title}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed">
                {next.lesson.summary}
              </p>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-widest">
                coming soon
              </div>
            </div>
          )
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            This is the last lesson in the module.
          </p>
        )}
      </div>
    </aside>
  );
}
