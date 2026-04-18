"use client";

import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { getModule } from "@/lib/curriculum";
import { lessonId, useProgress } from "@/lib/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  moduleSlug: string;
  currentLessonSlug: string;
};

export function Sidebar({ moduleSlug, currentLessonSlug }: Props) {
  const mod = getModule(moduleSlug);
  const progress = useProgress();
  if (!mod) return null;

  const builtCount = mod.lessons.filter((l) => l.built).length;
  const completedInModule = mod.lessons.filter((l) =>
    progress.completedLessons.includes(lessonId(moduleSlug, l.slug)),
  ).length;

  return (
    <nav
      aria-label="Lessons"
      className="flex h-full flex-col border-r border-border/60 bg-sidebar text-sidebar-foreground"
    >
      <div className="border-b border-border/60 px-5 py-5">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Module
        </div>
        <div className="mt-1 text-sm font-semibold">{mod.name}</div>
        <div className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {mod.tagline}
        </div>
        <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {completedInModule}/{builtCount} ready · {completedInModule} done
        </div>
      </div>

      <ScrollArea className="flex-1">
        <ol className="space-y-0.5 px-2 py-3">
          {mod.lessons.map((l) => {
            const isCurrent = l.slug === currentLessonSlug;
            const href = `/learn/${mod.slug}/${l.slug}`;
            const index = String(l.order).padStart(2, "0");
            const completed = progress.completedLessons.includes(
              lessonId(moduleSlug, l.slug),
            );
            const common =
              "group flex items-start gap-3 rounded-md px-3 py-2.5 text-sm transition-colors";

            if (!l.built) {
              return (
                <li key={l.slug}>
                  <div
                    className={`${common} cursor-not-allowed text-muted-foreground/60`}
                    aria-disabled
                  >
                    <span className="mt-0.5 font-mono text-[11px] tabular-nums">
                      {index}
                    </span>
                    <span className="flex-1 leading-snug">{l.title}</span>
                    <Lock className="mt-0.5 h-3 w-3 shrink-0" />
                  </div>
                </li>
              );
            }

            return (
              <li key={l.slug}>
                <Link
                  href={href}
                  className={`${common} ${
                    isCurrent
                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                  }`}
                >
                  <span
                    className={`mt-0.5 font-mono text-[11px] tabular-nums ${
                      isCurrent ? "" : "text-muted-foreground/70"
                    }`}
                  >
                    {index}
                  </span>
                  <span className="flex-1 leading-snug">{l.title}</span>
                  {completed ? (
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  ) : isCurrent ? (
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ol>
      </ScrollArea>
    </nav>
  );
}
