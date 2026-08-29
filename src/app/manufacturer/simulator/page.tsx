"use client";

import { PlatformShell } from "@/components/platform/PlatformShell";
import { SimulationCenter } from "@/components/platform/simulation/SimulationCenter";
import { useRequireRole } from "@/lib/auth/auth-context";

export default function ManufacturerSimulatorPage() {
  const auth = useRequireRole("MANUFACTURER");
  return (
    <PlatformShell role="MANUFACTURER">
      {auth.token ? <SimulationCenter role="MANUFACTURER" token={auth.token} /> : null}
    </PlatformShell>
  );
}
