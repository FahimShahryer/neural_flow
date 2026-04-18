/**
 * LessonShell — engine-agnostic chrome around any lesson.
 * Minimal in step 1; fleshed out in step 2 with sidebar nav, inspector panel,
 * progress indicator, and motion polish.
 */

import type { ReactNode } from "react";

type Props = {
  module: string;
  slug: string;
  title?: string;
  children: ReactNode;
};

export function LessonShell({ module, slug, title, children }: Props) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
      <header className="mb-10">
        <div className="font-mono text-xs uppercase tracking-widest text-neutral-500">
          {module} · {slug}
        </div>
        {title ? (
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">{title}</h1>
        ) : null}
      </header>
      <article className="prose prose-neutral dark:prose-invert prose-headings:font-semibold prose-h2:mt-12 prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed max-w-none">
        {children}
      </article>
    </div>
  );
}
