import type { ReactNode } from "react";
import Link from "next/link";
import { BrandWordmark } from "@/components/shared/Logo";

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-lime/8 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-ink/5 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgb(0 0 0 / 0.04) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="relative w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex justify-center" aria-label="FlowCapital AI home">
            <BrandWordmark size="lg" />
          </Link>
          <div className="mx-auto mt-5 h-px w-12 bg-gradient-to-r from-transparent via-lime/60 to-transparent" />
          <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p> : null}
        </div>

        <div className="rounded-[1.375rem] border border-foreground/10 bg-white/90 p-6 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)] backdrop-blur-sm md:p-8">
          {children}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          <span>Manufacturers</span>
          <span className="h-1 w-1 rounded-full bg-foreground/20" />
          <span>Lenders</span>
          <span className="h-1 w-1 rounded-full bg-foreground/20" />
          <span>Supply-chain finance</span>
        </div>
      </div>
    </div>
  );
}
