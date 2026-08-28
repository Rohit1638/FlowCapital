"use client";

import { useParams } from "next/navigation";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { LenderDecisionWorkspace } from "@/components/platform/LenderDecisionWorkspace";
import { useRequireRole } from "@/lib/auth/auth-context";

export default function LenderDecisionPage() {
  const params = useParams<{ id: string }>();
  const auth = useRequireRole("LENDER");

  return (
    <PlatformShell role="LENDER">
      {auth.token ? <LenderDecisionWorkspace requestId={params.id} token={auth.token} /> : null}
    </PlatformShell>
  );
}
