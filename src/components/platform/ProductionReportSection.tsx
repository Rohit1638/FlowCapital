"use client";

import { useState } from "react";
import { CheckCircle2, FileBarChart, Loader2 } from "lucide-react";
import { platformFetchAuth } from "@/lib/platform/client";
import { cn } from "@/lib/utils";

interface ProductionReportSectionProps {
  token: string;
  requestId: string;
}

export function ProductionReportSection({ token, requestId }: ProductionReportSectionProps) {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function generate() {
    setState("loading");
    try {
      const report = await platformFetchAuth<Record<string, unknown>>(token, `/production-requests/${requestId}/report`, {
        method: "POST",
      });
      const text = [
        "FlowCapital Production & Financing Report",
        "========================================",
        "",
        ...Object.entries(report).map(([k, v]) => `${k.replace(/_/g, " ").toUpperCase()}: ${v}`),
      ].join("\n");
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `flowcapital-report-${report.request_code ?? requestId}.txt`;
      a.click();
      setState("success");
      setTimeout(() => setState("idle"), 3000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  }

  return (
    <section className="rounded-[1.25rem] border border-foreground/10 bg-white p-6 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Reporting</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Generate a production and financing report from the available lifecycle, financial and document data.
          </p>
          {state === "success" ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-lime-deep">
              <CheckCircle2 className="h-4 w-4" /> Report downloaded successfully
            </p>
          ) : null}
          {state === "error" ? (
            <p className="mt-3 text-sm text-destructive">Unable to generate report. Please try again.</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={state === "loading"}
          className={cn(
            "inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3 text-sm font-semibold text-ink transition",
            "hover:-translate-y-0.5 hover:brightness-105 disabled:opacity-60",
          )}
        >
          {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileBarChart className="h-4 w-4" />}
          {state === "loading" ? "Generating report…" : "Generate Report"}
        </button>
      </div>
    </section>
  );
}
