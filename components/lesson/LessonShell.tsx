/**
 * LessonShell — engine-agnostic chrome around any lesson.
 *
 * Layout:
 *   top bar (brand, theme, GitHub)
 *   ┌────────────┬──────────────────────────┬────────────┐
 *   │  Sidebar   │         Main             │  Inspector │
 *   │  lessons   │  breadcrumb + MDX        │  context   │
 *   └────────────┴──────────────────────────┴────────────┘
 *
 * The sidebar and inspector are hidden on small screens so the main column
 * stays uncluttered; we'll add a mobile-friendly drawer in step 10.
 */

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Inspector } from "./Inspector";
import { TopBar } from "./TopBar";
import { LessonContent } from "./LessonContent";
import { getLesson } from "@/lib/curriculum";

type Props = {
  module: string;
  slug: string;
  title?: string;
  children: ReactNode;
};

export function LessonShell({ module, slug, title, children }: Props) {
  const resolved = getLesson(module, slug);
  const order = resolved?.lesson.order ?? 0;

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />

      <div className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_300px] xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="hidden lg:block">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)]">
            <Sidebar moduleSlug={module} currentLessonSlug={slug} />
          </div>
        </aside>

        <main className="min-w-0 px-6 py-10 sm:px-10 lg:px-14">
          <div className="mb-6 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">
              NeuralFlow
            </Link>
            <ChevronRight className="h-3 w-3 opacity-60" />
            <span>{resolved?.module.name ?? module}</span>
            <ChevronRight className="h-3 w-3 opacity-60" />
            <span className="tabular-nums">
              Lesson {String(order).padStart(2, "0")}
            </span>
          </div>

          {title ? (
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {title}
            </h1>
          ) : null}

          <div className="mt-8">
            <LessonContent>{children}</LessonContent>
          </div>
        </main>

        <aside className="hidden lg:block">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)]">
            <Inspector moduleSlug={module} lessonSlug={slug} />
          </div>
        </aside>
      </div>
    </div>
  );
}
