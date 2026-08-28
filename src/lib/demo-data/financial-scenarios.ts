import type { FinancialScenario } from "@/types/intelligence";

export const FINANCIAL_SCENARIOS: FinancialScenario[] = [
  {
    id: "prod-unlocks-capital",
    name: "Production progress unlocks capital",
    assetId: "DA-2026-001",
    summary: "Move Batch A-452 from 65% to 90% verified production.",
    input: { productionCompletion: 90 },
  },
  {
    id: "verification-unlocks",
    name: "Verification unlocks safer financing",
    assetId: "DA-2026-001",
    summary: "Treat remaining secondary checks as fully verified.",
    input: { verificationStatus: "VERIFIED", dataConfidence: 97 },
  },
  {
    id: "conflict-resolved",
    name: "Quantity conflict reduces capital — then resolve it",
    assetId: "DA-2026-003",
    summary: "Compare the open 60-unit mismatch with a resolved warehouse count.",
    input: { conflictSeverity: "NONE", openConflictCount: 0, verificationStatus: "VERIFIED", dataConfidence: 92 },
  },
  {
    id: "logistics-delay",
    name: "Logistics delay reduces financing confidence",
    assetId: "DA-2026-002",
    summary: "Apply a severe in-transit delay to shipment C-219.",
    input: { logisticsStatus: "SEVERELY_DELAYED" },
  },
];
