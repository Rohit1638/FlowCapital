"use client";

import Link from "next/link";
import type { ConflictRecord } from "@/types/integration";
import { Button } from "@/components/ui/button";
import { updateConflictStatus } from "@/lib/integration/store";

export function ConflictBoard({ conflicts }: { conflicts: ConflictRecord[] }) {
  return (
    <section className="rounded-[1.6rem] border border-foreground/10 bg-white p-5 md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Data conflicts</p>
      <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">Reconciliation holds</h2>
      <div className="mt-4 space-y-3">
        {conflicts.map((conflict) => (
          <div key={conflict.id} className="rounded-2xl bg-[#f4f4f0] px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs">{conflict.assetId}</p>
                <p className="mt-1 font-display text-lg font-semibold">{conflict.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{conflict.description}</p>
              </div>
              <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold uppercase text-lime">
                {conflict.severity} · {conflict.status}
              </span>
            </div>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              <p>Expected {conflict.expectedValue}</p>
              <p>Actual {conflict.actualValue}</p>
              <p>Difference {conflict.difference}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => updateConflictStatus(conflict.id, "UNDER_REVIEW")}>
                Mark under review
              </Button>
              <Button type="button" size="sm" variant="lime" onClick={() => updateConflictStatus(conflict.id, "RESOLVED")}>
                Resolve demo conflict
              </Button>
              <Link href={`/events/${conflict.eventId}`} className="inline-flex h-9 items-center rounded-full px-3.5 text-xs font-semibold text-ink/70 hover:text-ink">
                View event
              </Link>
            </div>
            <p className="mt-2 text-[11px] uppercase tracking-wide text-ink/40">Local demo action only</p>
          </div>
        ))}
        {conflicts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open reconciliation conflicts.</p>
        ) : null}
      </div>
    </section>
  );
}
