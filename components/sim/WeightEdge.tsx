"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";

export type WeightEdgePhase = "idle" | "forward" | "backward" | "update";

export type WeightEdgeData = {
  weight: number;
  /** Gradient magnitude for this edge (for backward-phase thickness). Optional. */
  gradient?: number;
  /** Current teaching phase. Drives pulse direction + color. */
  phase?: WeightEdgePhase;
  /** Force-show the numeric value label. */
  showLabel?: boolean;
};

export function WeightEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
}: EdgeProps) {
  const d = (data as WeightEdgeData | undefined) ?? { weight: 0 };

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const absW = Math.abs(d.weight);
  const phase = d.phase ?? "idle";
  const isBackward = phase === "backward" || phase === "update";

  // Forward: blue/red by sign. Backward: amber (reviewing the blame) or
  // a brief emerald flash for 'update' (weights just stepped).
  const strokeColor = isBackward
    ? phase === "update"
      ? "#10b981"
      : "#f59e0b"
    : d.weight >= 0
      ? "#3b82f6"
      : "#ef4444";
  const strokeWidth = Math.max(1, Math.min(5, absW * 2.5));
  const opacity = 0.35 + Math.min(0.55, absW * 0.45);

  // Pulse while propagating. Forward pass runs one direction, backprop the
  // other — CSS achieves this with opposite dash animations.
  const animation =
    phase === "forward"
      ? "nf-edge-pulse-forward 0.9s linear infinite"
      : phase === "backward"
        ? "nf-edge-pulse-backward 0.9s linear infinite"
        : undefined;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth,
          opacity,
          strokeDasharray: phase === "forward" || phase === "backward" ? "6 4" : undefined,
          animation,
          ...style,
        }}
      />
      {d.showLabel ? (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "none",
            }}
            className="rounded-md border border-border/70 bg-background/90 px-1.5 py-0.5 font-mono text-[9px] font-medium tabular-nums text-foreground shadow-sm"
          >
            {d.weight >= 0 ? "+" : ""}
            {d.weight.toFixed(2)}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
