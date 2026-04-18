"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";

export type WeightEdgeData = {
  weight: number;
  /** True while the forward pass just propagated through this edge. */
  pulsing?: boolean;
  /** Controls whether the numeric value label is visible. */
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
  const strokeColor = d.weight >= 0 ? "#3b82f6" : "#ef4444";
  const strokeWidth = Math.max(1, Math.min(5, absW * 2.5));
  const opacity = 0.35 + Math.min(0.55, absW * 0.45);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth,
          opacity,
          strokeDasharray: d.pulsing ? "6 4" : undefined,
          animation: d.pulsing ? "nf-edge-pulse 0.9s linear infinite" : undefined,
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
