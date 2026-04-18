"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Small client-side wrapper that fades/slides the lesson body on mount.
 * Kept separate so the LessonShell itself remains a Server Component.
 */
export function LessonContent({ children }: { children: ReactNode }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="prose prose-neutral dark:prose-invert prose-headings:font-semibold prose-h1:text-4xl prose-h1:tracking-tight prose-h1:mb-3 prose-h2:mt-14 prose-h2:text-2xl prose-h2:tracking-tight prose-h3:text-xl prose-p:leading-relaxed prose-p:text-foreground/90 prose-strong:text-foreground prose-a:text-foreground prose-a:underline-offset-4 prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none max-w-none"
    >
      {children}
    </motion.article>
  );
}
