"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SimulationState } from "@/types/simulation";

export function ConfidenceChart({ state }: { state: SimulationState }) {
  const data = state.confidence_history.map((h) => ({
    stage: h.stage.replace(/_/g, " ").slice(0, 8),
    confidence: h.confidence,
  }));

  if (data.length === 0) {
    data.push({ stage: "Start", confidence: state.starting_confidence });
  }

  return (
    <section className="rounded-[1.25rem] border border-foreground/10 bg-white p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Confidence through lifecycle</p>
      <div className="mt-4 h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <XAxis dataKey="stage" tick={{ fontSize: 10 }} stroke="#888" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#888" />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", fontSize: 12 }}
              formatter={(v) => [`${v ?? 0} / 100`, "Confidence"]}
            />
            <Line type="monotone" dataKey="confidence" stroke="#84cc16" strokeWidth={2.5} dot={{ r: 4, fill: "#22d3ee" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
