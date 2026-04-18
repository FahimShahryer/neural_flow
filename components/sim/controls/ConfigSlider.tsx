"use client";

import { Slider } from "@/components/ui/slider";

type Props = {
  label: string;
  /** Short hint shown next to the label. */
  sublabel?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  /** How to format the numeric readout on the right. */
  format?: (v: number) => string;
  disabled?: boolean;
};

export function ConfigSlider({
  label,
  sublabel,
  value,
  onChange,
  min,
  max,
  step = 1,
  format = (v) => v.toString(),
  disabled,
}: Props) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium text-foreground">{label}</span>
          {sublabel ? (
            <span className="text-[10px] text-muted-foreground">
              {sublabel}
            </span>
          ) : null}
        </div>
        <span className="font-mono text-xs tabular-nums text-foreground">
          {format(value)}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => {
          const next = Array.isArray(v) ? v[0] : v;
          if (typeof next === "number") onChange(next);
        }}
        disabled={disabled}
      />
    </div>
  );
}
