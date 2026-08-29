import Link from "next/link";
import { BrandWordmark } from "@/components/shared/Logo";

export function LandingFooter() {
  return (
    <footer className="border-t border-foreground/10 bg-[#ecece6]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10 md:flex-row md:items-end md:justify-between md:px-8">
        <div>
          <BrandWordmark />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Intelligence that moves with every asset.
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-ink/70">
          <Link href="/login?portal=1">Platform login</Link>
          <a href="#how-it-works">How it works</a>
          <a href="#memory">Financial memory</a>
        </div>
      </div>
      <div className="border-t border-foreground/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-5 text-xs text-muted-foreground md:flex-row md:justify-between md:px-8">
          <p>FlowCapital AI · Module 6A platform demo</p>
          <p>Manufacturer & lender intelligence desk</p>
        </div>
      </div>
    </footer>
  );
}
