import type { Metadata } from "next";
import { FinancialSimulator } from "@/components/simulator/FinancialSimulator";

export const metadata: Metadata = {
  title: "What-If Simulator",
};

export default function SimulatorPage() {
  return <FinancialSimulator />;
}
