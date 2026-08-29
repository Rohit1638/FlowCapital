"use client";

import { PlatformShell } from "@/components/platform/PlatformShell";
import { SimulationCenter } from "@/components/platform/simulation/SimulationCenter";
import { useRequireRole } from "@/lib/auth/auth-context";

export default function LenderSimulatorPage() {
  const auth = useRequireRole("LENDER");
  return (
    <PlatformShell role="LENDER">
      {auth.token ? <SimulationCenter role="LENDER" token={auth.token} /> : null}
    </PlatformShell>
  );
}
