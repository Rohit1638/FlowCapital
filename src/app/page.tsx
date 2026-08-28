import { FinancialMemory } from "@/components/landing/FinancialMemory";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingNav } from "@/components/landing/LandingNav";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <LandingHero />
      <HowItWorks />
      <FinancialMemory />
      <LandingFooter />
    </div>
  );
}
