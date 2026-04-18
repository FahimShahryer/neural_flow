"use client";

import { useMemo } from "react";
import { scaleLinear } from "d3-scale";
import { line, curveMonotoneX } from "d3-shape";
import { TrendingDown, TrendingUp } from "lucide-react";

type Props = {
  /** Per-epoch average losses, in order. */
  history: number[];
  /** Current epoch count so we can render where we are. */
  epochCount: number;
  /** Height of the chart in pixels. */
  height?: number;
  /** The latest sample loss — drawn as a faint dot alongside the main line. */
  sampleLoss?: number | null;
};

/**
 * LossChart — tiny SVG chart for per-epoch loss.
 *
 * Scales auto-adjust to the data range. The chart is intentionally minimalist:
 * a single curve, a current-point marker, two tiny labels. Nothing else
 * should distract from watching the line go down.
 */
export function LossChart({ history, epochCount, height = 200, sampleLoss }: Props) {
  const width = 560; // logical width — the SVG uses viewBox for responsive scaling
  const pad = { top: 18, right: 20, bottom: 28, left: 48 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  const { x, y, pathD, last, hasEnoughData, minL, maxL } = useMemo(() => {
    if (history.length < 2) {
      return {
        x: scaleLinear(),
        y: scaleLinear(),
        pathD: "",
        last: null as { cx: number; cy: number } | null,
        hasEnoughData: false,
        minL: 0,
        maxL: 1,
      };
    }
    const max = Math.max(...history);
    const min = Math.min(...history);
    const span = Math.max(1e-6, max - min);
    const xScale = scaleLinear()
      .domain([0, history.length - 1])
      .range([pad.left, pad.left + cw]);
    const yScale = scaleLinear()
      .domain([max + span * 0.1, min - span * 0.05])
      .range([pad.top, pad.top + ch]);
    const pathGen = line<number>()
      .x((_, i) => xScale(i)!)
      .y((v) => yScale(v)!)
      .curve(curveMonotoneX);
    const d = pathGen(history) ?? "";
    const lastIdx = history.length - 1;
    return {
      x: xScale,
      y: yScale,
      pathD: d,
      last: { cx: xScale(lastIdx)!, cy: yScale(history[lastIdx])! },
      hasEnoughData: true,
      minL: min,
      maxL: max,
    };
  }, [history, cw, ch, pad.left, pad.top]);

  const trendDown =
    history.length >= 2 && history[history.length - 1] < history[0];

  return (
    <div className="not-prose rounded-xl border border-border/70 bg-background p-4">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Loss curve
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Average MSE per epoch. Goal: this line goes down.
          </div>
        </div>
        {history.length >= 1 ? (
          <div className="flex items-baseline gap-2 text-xs">
            {trendDown ? (
              <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
            )}
            <span className="font-mono tabular-nums text-foreground">
              {history[history.length - 1].toFixed(4)}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              · epoch {epochCount}
            </span>
          </div>
        ) : null}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[200px] w-full"
        preserveAspectRatio="none"
      >
        {/* Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const yy = pad.top + t * ch;
          return (
            <line
              key={t}
              x1={pad.left}
              y1={yy}
              x2={pad.left + cw}
              y2={yy}
              stroke="currentColor"
              className="text-border/60"
              strokeWidth={1}
            />
          );
        })}

        {hasEnoughData ? (
          <>
            {/* Axis tick labels (min/max) */}
            <text
              x={pad.left - 6}
              y={pad.top + 4}
              textAnchor="end"
              className="fill-muted-foreground font-mono text-[10px]"
            >
              {maxL.toFixed(3)}
            </text>
            <text
              x={pad.left - 6}
              y={pad.top + ch + 2}
              textAnchor="end"
              className="fill-muted-foreground font-mono text-[10px]"
            >
              {minL.toFixed(3)}
            </text>

            {/* The curve */}
            <path
              d={pathD}
              stroke="currentColor"
              className="text-foreground"
              fill="none"
              strokeWidth={2.25}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Current point */}
            {last ? (
              <>
                <circle
                  cx={last.cx}
                  cy={last.cy}
                  r={7}
                  fill="currentColor"
                  className="text-foreground/10"
                />
                <circle
                  cx={last.cx}
                  cy={last.cy}
                  r={3.5}
                  fill="currentColor"
                  className="text-foreground"
                />
              </>
            ) : null}
          </>
        ) : (
          <text
            x={width / 2}
            y={height / 2}
            textAnchor="middle"
            className="fill-muted-foreground text-[11px]"
          >
            Loss curve appears after the first epoch.
          </text>
        )}

        {/* X-axis label + reference to current sample loss */}
        <text
          x={pad.left + cw / 2}
          y={height - 8}
          textAnchor="middle"
          className="fill-muted-foreground font-mono text-[10px] uppercase tracking-widest"
        >
          epoch
        </text>
        {typeof sampleLoss === "number" ? (
          <text
            x={pad.left + cw}
            y={height - 8}
            textAnchor="end"
            className="fill-muted-foreground font-mono text-[10px]"
          >
            last sample loss: {sampleLoss.toFixed(4)}
          </text>
        ) : null}
      </svg>
    </div>
  );
}
