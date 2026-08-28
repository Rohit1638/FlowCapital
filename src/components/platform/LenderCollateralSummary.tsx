"use client";

import { formatINRCompact } from "@/lib/format";
import { totalCollateralValue } from "@/lib/platform/lender-recommendation";
import type { ProductionRequest } from "@/types/platform";

function assetLabel(type: string) {
  const map: Record<string, string> = {
    RAW_MATERIAL: "Raw material inventory",
    INVENTORY: "Inventory",
    EQUIPMENT: "Manufacturing equipment",
  };
  return map[type] ?? type.replace(/_/g, " ");
}

export function LenderCollateralSummary({ request }: { request: ProductionRequest }) {
  const total = totalCollateralValue(request);
  const requested = request.required_funding_amount;
  const coverage = requested > 0 ? Math.round((total / requested) * 100) : 0;

  const grouped = (request.collateral ?? []).reduce<Record<string, number>>((acc, item) => {
    const key = assetLabel(item.asset_type);
    acc[key] = (acc[key] ?? 0) + item.estimated_value;
    return acc;
  }, {});

  return (
    <section className="rounded-[1.25rem] border border-foreground/10 bg-white p-6 md:p-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Collateral</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Total collateral value</p>
          <p className="mt-1 font-display text-2xl font-semibold">{formatINRCompact(total)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Requested funding</p>
          <p className="mt-1 font-display text-2xl font-semibold">{formatINRCompact(requested)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Coverage</p>
          <p className="mt-1 font-display text-2xl font-semibold text-cyan-700">{coverage}%</p>
        </div>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-foreground/8">
        <div className="h-full rounded-full bg-gradient-to-r from-lime to-cyan-500" style={{ width: `${Math.min(100, coverage)}%` }} />
      </div>
      <div className="mt-5 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Assets</p>
        {Object.entries(grouped).map(([name, value]) => (
          <div key={name} className="flex justify-between rounded-lg border border-foreground/8 px-3 py-2 text-sm">
            <span>{name}</span>
            <span className="font-semibold">{formatINRCompact(value)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
