"use client";

import { PlatformShell } from "@/components/platform/PlatformShell";
import { ManufacturerOfferComparison } from "@/components/platform/ManufacturerOfferComparison";
import { useRequireRole } from "@/lib/auth/auth-context";
import { useParams } from "next/navigation";

export default function ManufacturerOffersPage() {
  const params = useParams<{ id: string }>();
  const auth = useRequireRole("MANUFACTURER");

  return (
    <PlatformShell role="MANUFACTURER">
      {auth.token ? <ManufacturerOfferComparison requestId={params.id} token={auth.token} /> : null}
    </PlatformShell>
  );
}
