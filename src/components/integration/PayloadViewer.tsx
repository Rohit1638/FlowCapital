"use client";

import { useState } from "react";
import type { IntegrationEvent } from "@/types/integration";

export function PayloadViewer({ event }: { event: IntegrationEvent }) {
  const [open, setOpen] = useState<"raw" | "normalized" | null>("normalized");

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen(open === "raw" ? null : "raw")}
        className="w-full rounded-2xl border border-foreground/10 bg-white px-4 py-3 text-left text-sm font-semibold"
      >
        Source payload
      </button>
      {open === "raw" ? (
        <pre className="max-h-64 overflow-auto rounded-2xl bg-ink p-4 font-mono text-xs text-lime">
          {JSON.stringify(event.rawPayload, null, 2)}
        </pre>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen(open === "normalized" ? null : "normalized")}
        className="w-full rounded-2xl border border-foreground/10 bg-white px-4 py-3 text-left text-sm font-semibold"
      >
        Normalized event
      </button>
      {open === "normalized" ? (
        <pre className="max-h-64 overflow-auto rounded-2xl bg-ink p-4 font-mono text-xs text-white/80">
          {JSON.stringify(
            {
              id: event.id,
              assetId: event.assetId,
              source: event.source,
              eventType: event.eventType,
              payload: event.payload,
              status: event.status,
              confidence: event.confidence,
            },
            null,
            2,
          )}
        </pre>
      ) : null}
    </div>
  );
}
