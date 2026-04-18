"use client";

import { useState, useMemo } from "react";

type Activation = "linear" | "relu" | "sigmoid" | "tanh";

function activate(z: number, kind: Activation): number {
  switch (kind) {
    case "linear":
      return z;
    case "relu":
      return Math.max(0, z);
    case "sigmoid":
      return 1 / (1 + Math.exp(-z));
    case "tanh":
      return Math.tanh(z);
  }
}

const INPUT_LABELS = ["Size", "Bedrooms", "Location"] as const;

export function NeuronPlayground() {
  const [x, setX] = useState<[number, number, number]>([0.7, 0.6, 0.5]);
  const [w, setW] = useState<[number, number, number]>([0.8, 0.3, 0.5]);
  const [b, setB] = useState(0);
  const [act, setAct] = useState<Activation>("relu");

  const z = useMemo(
    () => x[0] * w[0] + x[1] * w[1] + x[2] * w[2] + b,
    [x, w, b],
  );
  const y = useMemo(() => activate(z, act), [z, act]);

  const edgeColor = (wi: number) => (wi >= 0 ? "#3b82f6" : "#ef4444");
  const edgeWidth = (wi: number) => Math.max(1, Math.abs(wi) * 3);
  const glow = Math.min(1, Math.abs(y));

  const setXi = (i: number, v: number) =>
    setX((prev) => prev.map((xj, j) => (j === i ? v : xj)) as [number, number, number]);
  const setWi = (i: number, v: number) =>
    setW((prev) => prev.map((wj, j) => (j === i ? v : wj)) as [number, number, number]);

  return (
    <div className="not-prose my-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <svg viewBox="0 0 420 180" className="mb-6 h-44 w-full">
        {[0, 1, 2].map((i) => (
          <line
            key={`e${i}`}
            x1="72"
            y1={40 + i * 50}
            x2="252"
            y2="90"
            stroke={edgeColor(w[i])}
            strokeWidth={edgeWidth(w[i])}
            opacity={0.75}
            style={{ transition: "stroke-width 150ms, stroke 150ms" }}
          />
        ))}

        {[0, 1, 2].map((i) => (
          <g key={`n${i}`}>
            <circle
              cx="64"
              cy={40 + i * 50}
              r="18"
              fill="#3b82f6"
              opacity={Math.min(1, Math.abs(x[i]) * 0.7 + 0.25)}
              style={{ transition: "opacity 150ms" }}
            />
            <text
              x="30"
              y={44 + i * 50}
              className="fill-neutral-500 text-[11px]"
              textAnchor="end"
            >
              {INPUT_LABELS[i]}
            </text>
            <text
              x="64"
              y={44 + i * 50}
              className="fill-white text-[10px] font-mono"
              textAnchor="middle"
            >
              {x[i].toFixed(2)}
            </text>
          </g>
        ))}

        <circle
          cx="272"
          cy="90"
          r="32"
          fill="#10b981"
          opacity={0.15 + glow * 0.75}
          style={{ transition: "opacity 150ms" }}
        />
        <circle cx="272" cy="90" r="32" fill="none" stroke="#10b981" strokeWidth="2" />
        <text
          x="272"
          y="87"
          className="fill-white text-[12px] font-mono font-semibold"
          textAnchor="middle"
        >
          {y.toFixed(2)}
        </text>
        <text
          x="272"
          y="101"
          className="fill-neutral-400 text-[9px] font-mono"
          textAnchor="middle"
        >
          {act}
        </text>

        <line x1="304" y1="90" x2="390" y2="90" stroke="#10b981" strokeWidth="2" />
        <polygon points="390,84 402,90 390,96" fill="#10b981" />
        <text
          x="355"
          y="78"
          className="fill-neutral-500 text-[11px]"
          textAnchor="middle"
        >
          Price
        </text>
      </svg>

      <div className="mb-4 flex items-center gap-2 text-xs">
        <span className="w-24 shrink-0 text-neutral-500">Activation</span>
        <div className="flex flex-wrap gap-1.5">
          {(["linear", "relu", "sigmoid", "tanh"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setAct(k)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                act === k
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <div className="space-y-2">
          <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-neutral-500">
            Inputs
          </div>
          {[0, 1, 2].map((i) => (
            <Slider
              key={`x${i}`}
              label={INPUT_LABELS[i]}
              value={x[i]}
              onChange={(v) => setXi(i, v)}
              min={0}
              max={1}
              step={0.01}
              tone="blue"
            />
          ))}
        </div>
        <div className="space-y-2">
          <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-neutral-500">
            Weights &amp; bias
          </div>
          {[0, 1, 2].map((i) => (
            <Slider
              key={`w${i}`}
              label={`w${i + 1}`}
              value={w[i]}
              onChange={(v) => setWi(i, v)}
              min={-2}
              max={2}
              step={0.01}
              tone={w[i] >= 0 ? "blue" : "red"}
            />
          ))}
          <Slider
            label="bias"
            value={b}
            onChange={setB}
            min={-2}
            max={2}
            step={0.01}
            tone="neutral"
          />
        </div>
      </div>

      <div className="mt-5 border-t border-neutral-200 pt-4 font-mono text-[11px] leading-relaxed text-neutral-500 dark:border-neutral-800">
        <div>
          z = w₁x₁ + w₂x₂ + w₃x₃ + b ={" "}
          <span className="text-neutral-900 dark:text-neutral-100">
            {z.toFixed(3)}
          </span>
        </div>
        <div>
          y = {act}(z) ={" "}
          <span className="text-emerald-600 dark:text-emerald-400">
            {y.toFixed(3)}
          </span>
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  tone,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  tone: "blue" | "red" | "neutral";
}) {
  const accent =
    tone === "blue"
      ? "accent-blue-500"
      : tone === "red"
        ? "accent-red-500"
        : "accent-neutral-500";
  return (
    <label className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-xs text-neutral-500">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`h-1 flex-1 ${accent}`}
      />
      <span className="w-12 text-right font-mono text-xs text-neutral-900 dark:text-neutral-100">
        {value.toFixed(2)}
      </span>
    </label>
  );
}
