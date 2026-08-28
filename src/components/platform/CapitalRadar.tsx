"use client";

import type { CapitalForecast } from "@/types/platform";
import { formatINRCompact } from "@/lib/format";

export function CapitalRadar({ forecast }: { forecast?: CapitalForecast | null }) {
  if (!forecast) {
    return (
      <div className="rounded-[1.4rem] border border-foreground/10 bg-ink p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">Capital Radar</p>
        <h3 className="mt-2 font-display text-2xl font-semibold">No forecast yet</h3>
        <p className="mt-3 text-sm text-white/60">Forecasts appear once a production plan and financing baseline exist.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.4rem] border border-foreground/10 bg-ink p-6 text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lime">Capital Radar</p>
      <h3 className="mt-2 font-display text-2xl font-semibold">Estimated funding gap</h3>
      <p className="mt-4 font-display text-5xl font-bold text-lime">{formatINRCompact(forecast.estimated_amount)}</p>
      <p className="mt-3 text-sm text-white/70">
        in approximately <span className="font-semibold text-white">{forecast.estimated_days} days</span>
      </p>
      <p className="mt-4 rounded-xl bg-white/5 p-3 text-xs leading-relaxed text-white/55">
        {forecast.summary ?? "FORECAST / SIMULATION based on open production plan burn rate and lifecycle milestones."}
      </p>
      <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-white/40">{forecast.label}</p>
    </div>
  );
}
