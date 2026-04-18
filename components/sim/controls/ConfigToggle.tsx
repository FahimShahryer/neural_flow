"use client";

import { Switch } from "@/components/ui/switch";

type Props = {
  label: string;
  sublabel?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

export function ConfigToggle({
  label,
  sublabel,
  value,
  onChange,
  disabled,
}: Props) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-background px-3 py-2 text-xs">
      <span>
        <span className="font-medium text-foreground">{label}</span>
        {sublabel ? (
          <span className="ml-2 text-[10px] text-muted-foreground">
            {sublabel}
          </span>
        ) : null}
      </span>
      <Switch checked={value} onCheckedChange={onChange} disabled={disabled} />
    </label>
  );
}
