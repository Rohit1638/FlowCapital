import type { ReactNode } from "react";
import Link from "next/link";

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-2">
        <div className="hidden flex-col justify-between border-r border-foreground/10 bg-ink p-10 text-white lg:flex">
          <div>
            <Link href="/" className="font-display text-3xl font-bold tracking-tight">
              FlowCapital<span className="text-lime">.</span>
            </Link>
            <p className="mt-8 font-display text-3xl font-semibold leading-tight">
              Physical goods.
              <br />
              Verified intelligence.
              <br />
              Smarter financing.
            </p>
            <p className="mt-6 max-w-sm text-sm text-white/60">
              Lifecycle-backed supply-chain financing for manufacturers and lenders.
            </p>
          </div>
          <div className="space-y-2 text-xs text-white/40">
            <p>PO Signed → Raw Material → Production → Finished Goods → In Transit → Invoiced → Settled</p>
          </div>
        </div>
        <div className="flex flex-col justify-center px-6 py-12 md:px-12">
          <div className="lg:hidden">
            <Link href="/" className="font-display text-2xl font-bold">
              FlowCapital<span className="text-lime">.</span>
            </Link>
          </div>
          <div className="mt-8 lg:mt-0">
            <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p> : null}
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
