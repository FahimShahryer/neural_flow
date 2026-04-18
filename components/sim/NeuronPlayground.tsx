"use client";

import { useMemo, useState } from "react";

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

// Real-world ranges for the house-price story.
const SIZE_MIN = 500,
  SIZE_MAX = 3500;
const BEDS_MIN = 1,
  BEDS_MAX = 5;
const PRICE_SCALE = 500; // y in [0..~1.4] → $0–$700k

type Preset = {
  label: string;
  emoji: string;
  size: number;
  beds: number;
  loc: number;
};

const PRESETS: Preset[] = [
  { label: "Small apartment", emoji: "🏢", size: 700, beds: 1, loc: 0.3 },
  { label: "Family home", emoji: "🏠", size: 2000, beds: 3, loc: 0.55 },
  { label: "Mansion", emoji: "🏰", size: 3400, beds: 5, loc: 0.9 },
];

const INPUT_META = [
  { key: "size" as const, label: "Size", help: "sqft" },
  { key: "beds" as const, label: "Bedrooms", help: "count" },
  { key: "loc" as const, label: "Location", help: "score 0–1" },
];

const WEIGHT_META = [
  { label: "w₁", hint: "how much size matters" },
  { label: "w₂", hint: "how much bedrooms matter" },
  { label: "w₃", hint: "how much location matters" },
];

function fmtPrice(y: number): string {
  const price = Math.round(y * PRICE_SCALE);
  return price >= 0 ? `$${price}k` : `−$${-price}k`;
}

export function NeuronPlayground() {
  const [size, setSize] = useState(2000);
  const [beds, setBeds] = useState(3);
  const [loc, setLoc] = useState(0.55);
  const [w, setW] = useState<[number, number, number]>([0.9, 0.3, 0.6]);
  const [b, setB] = useState(0);
  const [act, setAct] = useState<Activation>("linear");

  // Normalize real inputs for the math.
  const x = useMemo<[number, number, number]>(
    () => [
      (size - SIZE_MIN) / (SIZE_MAX - SIZE_MIN),
      (beds - BEDS_MIN) / (BEDS_MAX - BEDS_MIN),
      loc,
    ],
    [size, beds, loc],
  );

  const contribs = useMemo<[number, number, number]>(
    () => [w[0] * x[0], w[1] * x[1], w[2] * x[2]],
    [w, x],
  );
  const z = contribs[0] + contribs[1] + contribs[2] + b;
  const y = activate(z, act);

  const applyPreset = (p: Preset) => {
    setSize(p.size);
    setBeds(p.beds);
    setLoc(p.loc);
  };

  const setWi = (i: number, v: number) =>
    setW(
      (prev) =>
        prev.map((wj, j) => (j === i ? v : wj)) as [number, number, number],
    );

  const edgeColor = (wi: number) => (wi >= 0 ? "#3b82f6" : "#ef4444");
  const edgeWidth = (wi: number) => Math.max(1, Math.abs(wi) * 3);
  const glow = Math.min(1, Math.abs(y));

  return (
    <div className="not-prose my-8 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-widest text-neutral-500">
            The story
          </div>
          <div className="text-sm text-neutral-700 dark:text-neutral-300">
            Predict a house price from 3 features. Drag anything. Watch the
            price change.
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <span>{p.emoji}</span>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <svg viewBox="0 0 460 200" className="mb-5 h-48 w-full">
        {[0, 1, 2].map((i) => {
          const y1 = 48 + i * 50;
          const midX = (84 + 272) / 2;
          const midY = (y1 + 100) / 2;
          return (
            <g key={`edge${i}`}>
              <line
                x1="84"
                y1={y1}
                x2="272"
                y2="100"
                stroke={edgeColor(w[i])}
                strokeWidth={edgeWidth(w[i])}
                opacity={0.75}
                style={{ transition: "stroke-width 150ms, stroke 150ms" }}
              />
              <rect
                x={midX - 36}
                y={midY - 9}
                width="72"
                height="16"
                rx="8"
                fill="white"
                className="dark:fill-neutral-900"
                stroke={edgeColor(w[i])}
                strokeWidth="1"
                opacity="0.95"
              />
              <text
                x={midX}
                y={midY + 3}
                textAnchor="middle"
                className="fill-neutral-700 text-[10px] font-mono dark:fill-neutral-200"
              >
                {INPUT_META[i].label}: {contribs[i].toFixed(2)}
              </text>
            </g>
          );
        })}

        {[0, 1, 2].map((i) => (
          <g key={`in${i}`}>
            <circle
              cx="76"
              cy={48 + i * 50}
              r="20"
              fill="#3b82f6"
              opacity={Math.min(1, x[i] * 0.7 + 0.3)}
              style={{ transition: "opacity 150ms" }}
            />
            <text
              x="40"
              y={52 + i * 50}
              className="fill-neutral-500 text-[11px]"
              textAnchor="end"
            >
              {INPUT_META[i].label}
            </text>
            <text
              x="76"
              y={52 + i * 50}
              className="fill-white text-[10px] font-mono"
              textAnchor="middle"
            >
              {x[i].toFixed(2)}
            </text>
          </g>
        ))}

        <circle
          cx="296"
          cy="100"
          r="36"
          fill="#10b981"
          opacity={0.12 + glow * 0.78}
          style={{ transition: "opacity 200ms" }}
        />
        <circle
          cx="296"
          cy="100"
          r="36"
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
        />
        <text
          x="296"
          y="96"
          className="fill-white text-[13px] font-mono font-semibold"
          textAnchor="middle"
        >
          {y.toFixed(2)}
        </text>
        <text
          x="296"
          y="110"
          className="fill-neutral-400 text-[9px] font-mono"
          textAnchor="middle"
        >
          {act}
        </text>

        <line
          x1="332"
          y1="100"
          x2="420"
          y2="100"
          stroke="#10b981"
          strokeWidth="2"
        />
        <polygon points="420,93 434,100 420,107" fill="#10b981" />
        <text
          x="405"
          y="88"
          className="fill-neutral-500 text-[11px]"
          textAnchor="end"
        >
          Predicted price
        </text>
        <text
          x="405"
          y="118"
          className="fill-emerald-600 text-[14px] font-mono font-semibold dark:fill-emerald-400"
          textAnchor="end"
        >
          {fmtPrice(y)}
        </text>
      </svg>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="w-20 shrink-0 text-neutral-500">Activation</span>
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

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-3">
          <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
            Inputs — the house
          </div>
          <LabeledSlider
            label="Size"
            display={`${Math.round(size).toLocaleString()} sqft`}
            value={size}
            onChange={setSize}
            min={SIZE_MIN}
            max={SIZE_MAX}
            step={50}
            tone="blue"
          />
          <LabeledSlider
            label="Bedrooms"
            display={`${beds}`}
            value={beds}
            onChange={(v) => setBeds(Math.round(v))}
            min={BEDS_MIN}
            max={BEDS_MAX}
            step={1}
            tone="blue"
          />
          <LabeledSlider
            label="Location"
            display={loc.toFixed(2)}
            value={loc}
            onChange={setLoc}
            min={0}
            max={1}
            step={0.01}
            tone="blue"
          />
        </div>
        <div className="space-y-3">
          <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
            Weights &amp; bias — what the neuron has learned
          </div>
          {[0, 1, 2].map((i) => (
            <LabeledSlider
              key={`w${i}`}
              label={WEIGHT_META[i].label}
              sublabel={WEIGHT_META[i].hint}
              display={w[i].toFixed(2)}
              value={w[i]}
              onChange={(v) => setWi(i, v)}
              min={-2}
              max={2}
              step={0.01}
              tone={w[i] >= 0 ? "blue" : "red"}
            />
          ))}
          <LabeledSlider
            label="bias"
            sublabel="constant the neuron always adds"
            display={b.toFixed(2)}
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
          z = w₁·{x[0].toFixed(2)} + w₂·{x[1].toFixed(2)} + w₃·{x[2].toFixed(2)}{" "}
          + b ={" "}
          <span className="text-neutral-900 dark:text-neutral-100">
            {z.toFixed(3)}
          </span>
        </div>
        <div>
          y = {act}(z) ={" "}
          <span className="text-emerald-600 dark:text-emerald-400">
            {y.toFixed(3)}
          </span>{" "}
          →{" "}
          <span className="text-emerald-600 dark:text-emerald-400">
            {fmtPrice(y)}
          </span>
        </div>
      </div>
    </div>
  );
}

function LabeledSlider({
  label,
  sublabel,
  display,
  value,
  onChange,
  min,
  max,
  step,
  tone,
}: {
  label: string;
  sublabel?: string;
  display: string;
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
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
            {label}
          </span>
          {sublabel ? (
            <span className="text-[10px] text-neutral-500">{sublabel}</span>
          ) : null}
        </div>
        <span className="font-mono text-xs text-neutral-900 dark:text-neutral-100">
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`h-1 w-full ${accent}`}
      />
    </div>
  );
}
