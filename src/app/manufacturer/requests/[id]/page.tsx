"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { ProductionRequestDetail } from "@/components/platform/ProductionRequestDetail";
import { useRequireRole } from "@/lib/auth/auth-context";
import type { ProductionRequest } from "@/types/platform";
import { fetchProductionRequest } from "@/lib/platform/hooks";

/** Legacy route — kept for backward compatibility */
export default function ManufacturerRequestPage() {
  const params = useParams<{ id: string }>();
  const auth = useRequireRole("MANUFACTURER");
  const [request, setRequest] = useState<ProductionRequest | null>(null);

  const load = () => {
    if (!auth.token) return;
    fetchProductionRequest(auth.token, params.id).then(setRequest);
  };

  useEffect(load, [auth.token, params.id]);

  if (!request) {
    return (
      <PlatformShell role="MANUFACTURER">
        <p className="text-muted-foreground">Loading production request…</p>
      </PlatformShell>
    );
  }

  return (
    <PlatformShell role="MANUFACTURER">
      <ProductionRequestDetail request={request} token={auth.token!} onRefresh={load} />
    </PlatformShell>
  );
}
