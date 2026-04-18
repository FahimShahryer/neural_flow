"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

export type NeuronNodeData = {
  role: "input" | "hidden" | "output";
  value: number;
  active: boolean;
  label?: string;
};

const ROLE_COLOR: Record<NeuronNodeData["role"], string> = {
  input: "#3b82f6",
  hidden: "#f59e0b",
  output: "#10b981",
};

const ROLE_LABEL_COLOR: Record<NeuronNodeData["role"], string> = {
  input: "text-blue-500",
  hidden: "text-amber-500",
  output: "text-emerald-500",
};

export function NeuronNode({ data }: NodeProps) {
  const d = data as NeuronNodeData;
  const color = ROLE_COLOR[d.role];
  const glow = Math.min(1, Math.abs(d.value));

  return (
    <div className="group relative">
      {d.label ? (
        <div
          className={`pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium uppercase tracking-wider ${ROLE_LABEL_COLOR[d.role]} opacity-80`}
        >
          {d.label}
        </div>
      ) : null}

      <div
        className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 text-[11px] font-mono font-semibold text-white transition-all duration-200 group-hover:scale-105"
        style={{
          borderColor: color,
          background: color,
          opacity: d.active ? 0.3 + glow * 0.7 : 0.35,
          boxShadow: d.active
            ? `0 0 ${8 + glow * 16}px ${color}`
            : "0 0 0 rgba(0,0,0,0)",
        }}
      >
        <span>{d.value.toFixed(2)}</span>
      </div>

      {d.role !== "input" ? (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-2 !w-2 !border-none !bg-neutral-500 opacity-60"
        />
      ) : null}
      {d.role !== "output" ? (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-2 !w-2 !border-none !bg-neutral-500 opacity-60"
        />
      ) : null}
    </div>
  );
}
