"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RiskSnapshot } from "@/types/risk";
import { formatDate } from "@/lib/format";

export function RiskHistoryChart({
  history,
  currentScore,
}: {
  history: RiskSnapshot[];
  currentScore: number;
}) {
  const data = history.map((point, index) => ({
    label: `Day ${index * 2 + 1}`,
    score: point.score,
    date: formatDate(point.timestamp),
    reason: point.reason,
  }));
  const previous = history.length > 1 ? history[history.length - 2] : null;
  const change = previous ? currentScore - previous.score : 0;
  const latest = history[history.length - 1];

  return (
    <section className="rounded-[1.6rem] border border-foreground/10 bg-white p-5 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Risk history</p>
          <h2 className="font-display text-2xl font-semibold tracking-tight">Local risk path</h2>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl font-semibold">{currentScore}</p>
          <p className="text-xs text-muted-foreground">
            {change >= 0 ? "+" : ""}
            {change} over the last snapshot
          </p>
        </div>
      </div>
      <div className="mt-4 h-[180px]">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#6B6D76", fontSize: 12 }} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.[0] ? (
                    <div className="rounded-xl border border-foreground/10 bg-white px-3 py-2 text-xs">
                      {payload[0].payload.date}: {payload[0].value}
                    </div>
                  ) : null
                }
              />
              <Area type="monotone" dataKey="score" stroke="#17181F" fill="#B9FF66" fillOpacity={0.35} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground">Risk path will appear as the twin ages.</p>
        )}
      </div>
      {latest ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Primary reason: {latest.reason}
        </p>
      ) : null}
    </section>
  );
}
