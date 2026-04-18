import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-baseline gap-2 text-sm font-semibold tracking-tight"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-foreground transition-transform group-hover:scale-125" />
          NeuralFlow
          <span className="hidden font-mono text-[10px] font-normal uppercase tracking-widest text-muted-foreground sm:inline">
            · learn by doing
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/FahimShahryer/neural_flow"
            target="_blank"
            rel="noreferrer"
            className="hidden text-xs text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            GitHub →
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
