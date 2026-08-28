"use client";

import { CAPITAL_PRESETS } from "@/lib/demo-data/allocation-scenarios";
import { formatINRFull } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export function AvailableCapitalInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <section className="rounded-[1.5rem] border border-foreground/10 bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Available capital</p>
      <p className="mt-2 font-display text-3xl font-semibold">{formatINRFull(value)}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {CAPITAL_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onChange(preset.value)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide",
              value === preset.value ? "bg-ink text-white" : "bg-[#f4f4f0] text-ink/70",
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <label className="mt-4 block text-xs text-muted-foreground">Custom amount (INR)</label>
      <Input
        type="number"
        min={0}
        step={100000}
        value={value}
        onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
        className="mt-2"
      />
    </section>
  );
}
