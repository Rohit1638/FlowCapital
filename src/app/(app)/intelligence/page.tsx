import type { Metadata } from "next";
import { PortfolioIntelligence } from "@/components/intelligence/PortfolioDesk";

export const metadata: Metadata = {
  title: "Portfolio Intelligence",
};

export default function IntelligencePage() {
  return <PortfolioIntelligence />;
}
