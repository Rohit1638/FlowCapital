"use client";

import { CONNECTORS } from "@/lib/integration/connectors";
import { cn } from "@/lib/utils";

export function ConnectorStatusBar() {
  return (
    <section className="rounded-[1.4rem] border border-foreground/10 bg-white px-5 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Simulated connectors
        </p>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink/40">Demo connected</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {CONNECTORS.map((connector) => (
          <div key={connector.id} className="flex items-center gap-2">
            <span
              className={cn("h-2 w-2 rounded-full", connector.health >= 95 ? "bg-lime" : "bg-[#f0c75e]")}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{connector.id}</p>
              <p className="text-[11px] text-muted-foreground">{connector.health.toFixed(1)}% health</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
