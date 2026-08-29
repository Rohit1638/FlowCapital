"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { BrandWordmark } from "@/components/shared/Logo";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { AIAssistantPanel } from "@/components/platform/AIAssistantPanel";
import { LenderContent } from "@/components/platform/LenderContent";
import { useRequireRole } from "@/lib/auth/auth-context";
import { formatINRCompact } from "@/lib/format";
import { DEMO_REQUEST_ID } from "@/lib/platform/demo-fallback";
import { fetchOpportunity } from "@/lib/platform/hooks";
import type { ProductionRequest } from "@/types/platform";

const SUGGESTED = [
  "Should I finance this request?",
  "Why is the confidence score 68?",
  "What are the biggest risks?",
  "What changed in the production plan?",
  "Is the collateral sufficient?",
  "What documents are still missing?",
  "How much exposure would be reasonable?",
  "What evidence supports this request?",
  "Summarize this manufacturer's financing position.",
];

export function LenderAIAssistantContent() {
  const auth = useRequireRole("LENDER");
  const searchParams = useSearchParams();
  const requestId = searchParams.get("request") ?? DEMO_REQUEST_ID;
  const [request, setRequest] = useState<ProductionRequest | null>(null);

  useEffect(() => {
    if (!auth.token) return;
    fetchOpportunity(auth.token, requestId).then(setRequest);
  }, [auth.token, requestId]);

  const contextCards = useMemo(
    () => [
      ["Manufacturer", request?.manufacturer_name ?? "—"],
      ["Funding requested", formatINRCompact(request?.required_funding_amount ?? 0)],
      ["Confidence", `${request?.confidence_score ?? "—"} / 100`],
      ["Production stage", request?.current_stage.replace(/_/g, " ") ?? "—"],
    ],
    [request],
  );

  return (
    <PlatformShell role="LENDER">
      <LenderContent className="space-y-8">
        <header>
          <BrandWordmark size="sm" className="mb-3" />
          <h1 className="font-display text-3xl font-semibold tracking-tight">Lender intelligence copilot</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Understand production evidence, financing exposure, collateral and confidence before making a decision.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {contextCards.map(([label, value]) => (
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
              role="LENDER"
              productionRequestId={requestId}
              quickActions={SUGGESTED}
              theme="dark"
            />
          ) : null}
        </motion.div>

        <p className="text-center text-xs text-muted-foreground">
          <Link href={`/lender/opportunities/${requestId}/decision`} className="underline underline-offset-2 hover:text-ink">
            Back to decision workspace
          </Link>
        </p>
      </LenderContent>
    </PlatformShell>
  );
}
