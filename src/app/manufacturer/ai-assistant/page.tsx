"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BrandWordmark } from "@/components/shared/Logo";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { AIAssistantPanel } from "@/components/platform/AIAssistantPanel";
import { ManufacturerContent } from "@/components/platform/ManufacturerContent";
import { useRequireRole } from "@/lib/auth/auth-context";
import { formatINRCompact } from "@/lib/format";
import { fetchManufacturerDashboard } from "@/lib/platform/hooks";
import { DEMO_REQUEST_ID } from "@/lib/platform/demo-fallback";

const SUGGESTED = [
  "Why is my confidence score 68?",
  "What is blocking my financing?",
  "How can I improve my financeability?",
  "What changed in my latest production event?",
  "Summarize my financing request.",
  "Which documents are missing?",
  "What should I do next?",
];

export default function ManufacturerAIAssistantPage() {
  const auth = useRequireRole("MANUFACTURER");
  const [context, setContext] = useState<Awaited<ReturnType<typeof fetchManufacturerDashboard>> | null>(null);

  useEffect(() => {
    if (!auth.token) return;
    fetchManufacturerDashboard(auth.token).then(setContext);
  }, [auth.token]);

  const req = context?.requests?.[0];

  return (
    <PlatformShell role="MANUFACTURER">
      <ManufacturerContent className="space-y-8">
        <header>
          <BrandWordmark size="sm" className="mb-3" />
          <h1 className="font-display text-3xl font-semibold tracking-tight">Your production and financing copilot</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Structured insights on confidence, funding readiness, documents, and lifecycle events — powered by deterministic finance with AI explanation.
          </p>
        </header>

        {/* Context summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Current production", req?.project_name ?? "Electric Bike Series X"],
            ["Funding requested", formatINRCompact(req?.required_funding_amount ?? 5_000_000)],
            ["Confidence", `${req?.confidence_score ?? 68} — Moderate`],
            ["Open issues", `${req?.open_conflicts ?? 1} conflict`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[1.25rem] border border-foreground/10 bg-white p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
              <p className="mt-2 font-display text-lg font-semibold">{value}</p>
            </div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[1.25rem] border border-foreground/10 bg-ink p-6 md:p-8"
        >
          <div className="mb-4">
            <BrandWordmark inverted size="sm" />
          </div>
          {auth.token ? (
            <AIAssistantPanel
              token={auth.token}
              role="MANUFACTURER"
              productionRequestId={req?.id ?? DEMO_REQUEST_ID}
              quickActions={SUGGESTED}
              theme="dark"
            />
          ) : null}
        </motion.div>

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/manufacturer/dashboard" className="underline underline-offset-2 hover:text-ink">
            Back to overview
          </Link>
        </p>
      </ManufacturerContent>
    </PlatformShell>
  );
}
