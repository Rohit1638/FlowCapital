"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Play, Sparkles } from "lucide-react";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { useRequireRole } from "@/lib/auth/auth-context";
import { fetchLenderReassessments, triggerDemoReassessment } from "@/lib/platform/hooks";
import type { ReassessmentRecord } from "@/types/platform";
import { cn } from "@/lib/utils";

export default function LenderReassessmentsPage() {
  const auth = useRequireRole("LENDER");
  const [items, setItems] = useState<ReassessmentRecord[]>([]);
  const [filter, setFilter] = useState<"ALL" | "HIGH" | "CRITICAL">("ALL");
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoMessage, setDemoMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!auth.token) return;
    const priority = filter === "ALL" ? undefined : filter;
    setItems(await fetchLenderReassessments(auth.token, priority));
  }, [auth.token, filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function runDemoEvent() {
    if (!auth.token) return;
    setLoadingDemo(true);
    setDemoMessage(null);
    try {
      const res = await triggerDemoReassessment(auth.token);
      const record = res.reassessment?.record;
      setDemoMessage(
        record
          ? `New reassessment created: confidence ${record.previous_confidence}% → ${record.new_confidence}%.`
          : "Demo event processed.",
      );
      await load();
    } catch {
      setDemoMessage("Could not trigger demo event. Is the backend running?");
    } finally {
      setLoadingDemo(false);
    }
  }

  return (
    <PlatformShell role="LENDER">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 md:px-8">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Module 4</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">Reassessment Center</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Your autonomous review queue. When production events change confidence, risk, or safe financing capacity on
            projects you fund, FlowCapital recalculates exposure and tells you what to do next.
          </p>
        </header>

        <section className="rounded-[1.25rem] border border-foreground/10 bg-white p-6">
          <h2 className="font-semibold">How to use this (3 steps)</h2>
          <ol className="mt-4 space-y-4 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">1</span>
              <span>
                <strong className="text-ink">Open the queue below</strong> — each card is an automatic review triggered when
                production confidence, risk, or safe financing capacity changes on a project you fund.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">2</span>
              <span>
                <strong className="text-ink">Click &quot;Review reassessment&quot;</strong> to see before/after confidence, risk,
                and capacity. Choose Acknowledge, Continue monitoring, or Request evidence.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">3</span>
              <span>
                <strong className="text-ink">Try the demo paths:</strong> use &quot;Trigger demo reassessment&quot; for an instant
                production-delay event, or run the{" "}
                <Link href="/lender/simulator" className="font-semibold text-lime-deep underline">
                  simulation
                </Link>{" "}
                and click Next Event — material steps create new cards here automatically.
              </span>
            </li>
          </ol>
        </section>

        <section className="rounded-[1.25rem] border border-lime/25 bg-lime/5 p-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime/30 text-ink">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-ink">Why this tab exists</h2>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                <li>• Detects material changes from simulation steps and live production events</li>
                <li>• Shows before → after confidence, risk, and safe capacity</li>
                <li>• Recommends lender actions: acknowledge, monitor, or request evidence</li>
              </ul>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={loadingDemo}
              onClick={runDemoEvent}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Activity className="h-4 w-4" />
              {loadingDemo ? "Triggering…" : "Trigger demo reassessment"}
            </button>
            <Link
              href="/lender/simulator"
              className="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-5 py-2.5 text-sm font-semibold"
            >
              <Play className="h-4 w-4" />
              Run simulation
            </Link>
          </div>
          {demoMessage ? <p className="mt-3 text-sm text-ink">{demoMessage}</p> : null}
        </section>

        <div className="flex gap-2">
          {(["ALL", "HIGH", "CRITICAL"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition",
                filter === f ? "bg-ink text-white" : "border border-foreground/15 text-muted-foreground",
              )}
            >
              {f === "ALL" ? "Recent" : f}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No reassessments match this filter. Use &quot;Trigger demo reassessment&quot; or advance the{" "}
            <Link href="/lender/simulator" className="font-semibold text-lime-deep underline">
              simulation
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-4">
            {items.map((r) => (
              <motion.article
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[1.25rem] border border-foreground/10 bg-white p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span
                      className={cn(
                        "text-xs font-bold uppercase",
                        r.impact_level.includes("HIGH") || r.impact_level.includes("CRITICAL")
                          ? "text-red-700"
                          : "text-amber-700",
                      )}
                    >
                      {r.impact_level.replace(/_/g, " ")}
                    </span>
                    <h2 className="mt-1 font-display text-lg font-semibold">{r.manufacturer_name}</h2>
                    <p className="text-sm text-muted-foreground">{r.project_name ?? r.request_code}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{r.trigger_type.replace(/_/g, " ")}</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
                  <p>
                    Confidence:{" "}
                    <strong>
                      {r.previous_confidence}% → {r.new_confidence}%
                    </strong>
                  </p>
                  <p>
                    Risk:{" "}
                    <strong>
                      {r.previous_risk} → {r.new_risk}
                    </strong>
                  </p>
                  <p>
                    Capacity:{" "}
                    <strong>
                      ₹{(r.previous_safe_capacity / 100_000).toFixed(1)}L → ₹{(r.new_safe_capacity / 100_000).toFixed(1)}L
                    </strong>
                  </p>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{r.reason_summary}</p>
                <p className="mt-2 text-sm font-semibold text-ink">{r.recommended_action.replace(/_/g, " ")}</p>
                <Link
                  href={`/lender/reassessments/${r.id}`}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-sm font-semibold text-ink"
                >
                  Review reassessment
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </PlatformShell>
  );
}
