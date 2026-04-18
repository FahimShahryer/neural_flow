"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = { value: string; label: string };

type Props = {
  label: string;
  sublabel?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  disabled?: boolean;
};

export function ConfigSelect({
  label,
  sublabel,
  value,
  onChange,
  options,
  disabled,
}: Props) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-medium text-foreground">{label}</span>
        {sublabel ? (
          <span className="text-[10px] text-muted-foreground">
            {sublabel}
          </span>
        ) : null}
      </div>
      <Select
        value={value}
        onValueChange={(v) => {
          if (v != null) onChange(v);
        }}
        disabled={disabled}
      >
        <SelectTrigger className="h-8 w-full text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-xs">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
