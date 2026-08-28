"use client";

import { PlatformShell } from "@/components/platform/PlatformShell";
import { FinancingRequestWizard } from "@/components/platform/FinancingRequestWizard";
import { ManufacturerContent } from "@/components/platform/ManufacturerContent";
import { useRequireRole } from "@/lib/auth/auth-context";

export default function FinancingRequestPage() {
  const auth = useRequireRole("MANUFACTURER");

  return (
    <PlatformShell role="MANUFACTURER">
      <ManufacturerContent className="space-y-8">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Financing Request</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Request working capital</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Request working capital against your verified production assets and lifecycle evidence.
          </p>
        </header>
        {auth.token ? <FinancingRequestWizard token={auth.token} /> : null}
      </ManufacturerContent>
    </PlatformShell>
  );
}
