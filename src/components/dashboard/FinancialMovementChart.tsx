"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLiveAssets } from "@/lib/demo-store";
import { deriveFinancialMovement } from "@/lib/selectors";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-foreground/10 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-semibold">{label}</p>
      {payload.map((item) => (
        <p key={item.name} className="text-muted-foreground">
          {item.name}: <span className="font-medium text-ink">₹{item.value.toFixed(1)} Cr</span>
        </p>
      ))}
    </div>
  );
}

export function FinancialMovementChart() {
  const assets = useLiveAssets();
  const financialMovement = deriveFinancialMovement(assets);
  return (
    <section className="rounded-[1.6rem] border border-foreground/10 bg-white p-5 md:p-6">
      <div className="mb-6 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Section 03
          </p>
          <h2 className="font-display text-2xl font-semibold tracking-tight">Financial Movement</h2>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-ink" /> Asset value
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-lime" /> Capital deployed
          </span>
        </div>
      </div>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={financialMovement} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="valueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#17181F" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#17181F" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="deployedFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#B9FF66" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#B9FF66" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(23,24,31,0.06)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#6B6D76", fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#6B6D76", fontSize: 12 }}
              tickFormatter={(value: number) => `${value}`}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="assetValue"
              name="Asset value"
              stroke="#17181F"
              strokeWidth={2}
              fill="url(#valueFill)"
            />
            <Area
              type="monotone"
              dataKey="capitalDeployed"
              name="Capital deployed"
              stroke="#8FCF3A"
              strokeWidth={2}
              fill="url(#deployedFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
