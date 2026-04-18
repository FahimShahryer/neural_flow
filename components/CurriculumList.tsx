"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { Module } from "@/lib/curriculum";
import { lessonId, useProgress } from "@/lib/progress";

type Props = {
  mod: Module;
};

export function CurriculumList({ mod }: Props) {
  const progress = useProgress();
  const builtCount = mod.lessons.filter((l) => l.built).length;
  const completedInModule = mod.lessons.filter((l) =>
    progress.completedLessons.includes(lessonId(mod.slug, l.slug)),
  ).length;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Curriculum — {mod.name}
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>{builtCount}/{mod.lessons.length} ready</span>
          <span className="text-foreground">
            {completedInModule}/{builtCount} done
          </span>
        </div>
      </div>

      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-border/60">
        <div
          className="h-full bg-emerald-500 transition-[width] duration-500"
          style={{
            width: builtCount
              ? `${(completedInModule / builtCount) * 100}%`
              : "0%",
          }}
        />
      </div>

      <ol className="mt-4 divide-y divide-border/60 rounded-xl border border-border/70 bg-card/30">
        {mod.lessons.map((l) => {
          const completed = progress.completedLessons.includes(
            lessonId(mod.slug, l.slug),
          );
          if (l.built) {
            return (
              <li key={l.slug}>
                <Link
                  href={`/learn/${mod.slug}/${l.slug}`}
                  className="group flex items-baseline gap-4 px-5 py-4 transition-colors hover:bg-accent/40"
                >
                  <span className="w-6 font-mono text-xs tabular-nums text-muted-foreground">
                    {String(l.order).padStart(2, "0")}
                  </span>
                  <span className="flex flex-1 flex-wrap items-baseline gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {l.title}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {l.summary}
                    </span>
                  </span>
                  {completed ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                  )}
                </Link>
              </li>
            );
          }
          return (
            <li key={l.slug}>
              <div className="flex items-baseline gap-4 px-5 py-4 text-muted-foreground/60">
                <span className="w-6 font-mono text-xs tabular-nums">
                  {String(l.order).padStart(2, "0")}
                </span>
                <span className="flex flex-1 flex-wrap items-baseline gap-2">
                  <span className="text-sm font-medium">{l.title}</span>
                  <span className="text-sm">{l.summary}</span>
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest">
                  soon
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
