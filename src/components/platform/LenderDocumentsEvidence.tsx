"use client";

import { Check, Download, Eye, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RequestDocument } from "@/types/platform";

function statusLabel(status: string) {
  const s = status.toUpperCase();
  if (s === "VERIFIED") return "Verified";
  if (s === "PENDING") return "Under review";
  return status.replace(/_/g, " ");
}

function statusClass(status: string) {
  const s = status.toUpperCase();
  if (s === "VERIFIED") return "text-lime-deep";
  if (s === "PENDING") return "text-cyan-700";
  return "text-muted-foreground";
}

function docTitle(type: string, name: string) {
  const map: Record<string, string> = {
    PURCHASE_ORDER: "Purchase Order",
    PRODUCTION_PLAN: "Production Plan",
    INVOICE: "Invoice",
    GST_CERTIFICATE: "GST Certificate",
    COLLATERAL: "Collateral Ownership Proof",
  };
  return map[type] ?? name.replace(/_/g, " ").replace(/\.pdf/i, "");
}

export function LenderDocumentsEvidence({ documents }: { documents: RequestDocument[] }) {
  const verified = documents.filter((d) => d.verification_status === "VERIFIED").length;

  return (
    <section className="rounded-[1.25rem] border border-foreground/10 bg-white p-6 md:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-foreground/8 pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Documents & evidence</p>
          <p className="mt-1 text-sm text-muted-foreground">{verified} of {documents.length} verified</p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {documents.map((doc) => {
          const verifiedDoc = doc.verification_status === "VERIFIED";
          return (
            <div
              key={doc.id}
              className="grid grid-cols-1 items-center gap-3 rounded-xl border border-foreground/8 px-4 py-3 sm:grid-cols-[1fr_auto]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                    verifiedDoc ? "border-lime/40 bg-lime/10 text-lime-deep" : "border-cyan-500/30 bg-cyan-50/50",
                  )}
                >
                  {verifiedDoc ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="h-2.5 w-2.5 rounded-full border-2 border-cyan-500/50" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{docTitle(doc.document_type, doc.document_name)}</p>
                  <p className={cn("text-xs font-semibold uppercase tracking-wide", statusClass(doc.verification_status))}>
                    {statusLabel(doc.verification_status)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 sm:justify-end">
                <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/10 px-3 py-1.5 text-xs font-medium hover:bg-surface-2">
                  <Eye className="h-3.5 w-3.5" />
                  View
                </button>
                <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/10 px-3 py-1.5 text-xs font-medium hover:bg-surface-2">
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
              </div>
            </div>
          );
        })}
        {documents.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-foreground/15 px-4 py-6 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            No documents submitted yet.
          </div>
        ) : null}
      </div>
    </section>
  );
}
