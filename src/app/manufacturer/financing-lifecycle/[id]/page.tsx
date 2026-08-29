"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { FinancingLifecyclePanel } from "@/components/platform/FinancingLifecyclePanel";
import { ManufacturerContent } from "@/components/platform/ManufacturerContent";
import { useRequireRole } from "@/lib/auth/auth-context";
import { fetchManufacturerLifecycle } from "@/lib/platform/hooks";
import type { FinancingLifecycleView } from "@/types/platform";

export default function ManufacturerFinancingLifecyclePage() {
  const params = useParams<{ id: string }>();
  const auth = useRequireRole("MANUFACTURER");
  const [lifecycle, setLifecycle] = useState<FinancingLifecycleView | null>(null);

  useEffect(() => {
    if (!auth.token) return;
    fetchManufacturerLifecycle(auth.token, params.id).then(setLifecycle);
  }, [auth.token, params.id]);

  return (
    <PlatformShell role="MANUFACTURER">
      <ManufacturerContent className="space-y-6">
        <Link href="/manufacturer/dashboard" className="text-sm font-medium text-muted-foreground hover:text-ink">
          ← Back to dashboard
        </Link>
        {lifecycle ? <FinancingLifecyclePanel lifecycle={lifecycle} requestId={params.id} /> : <p className="text-sm text-muted-foreground">Loading lifecycle…</p>}
      </ManufacturerContent>
    </PlatformShell>
  );
}
