"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { ManufacturerContent } from "@/components/platform/ManufacturerContent";
import { useRequireRole } from "@/lib/auth/auth-context";
import { formatINRCompact } from "@/lib/format";
import { fetchProductionRequests } from "@/lib/platform/hooks";
import type { ProductionRequest } from "@/types/platform";

export default function ProductionPlansPage() {
  const auth = useRequireRole("MANUFACTURER");
  const [items, setItems] = useState<ProductionRequest[]>([]);

  useEffect(() => {
    if (!auth.token) return;
    fetchProductionRequests(auth.token).then(setItems);
  }, [auth.token]);

  return (
    <PlatformShell role="MANUFACTURER">
      <ManufacturerContent className="space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Production Plans</p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Active production & lifecycle tracking</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage production-backed plans, collateral, and lifecycle evidence.
            </p>
          </div>
          <Link
            href="/manufacturer/financing-request"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
          >
            New financing request
          </Link>
        </header>

        <div className="space-y-4">
          {items.map((req) => (
            <Link
              key={req.id}
              href={`/manufacturer/production-plans/${req.id}`}
              className="block rounded-[1.25rem] border border-foreground/10 bg-white p-6 transition hover:-translate-y-0.5 hover:border-lime"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{req.request_code}</p>
                  <h3 className="mt-1 font-display text-2xl font-semibold">{req.project_name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{req.product_name} · {req.quantity.toLocaleString()} units</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Requested</p>
                  <p className="font-display text-2xl font-semibold">{formatINRCompact(req.required_funding_amount)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </ManufacturerContent>
    </PlatformShell>
  );
}
