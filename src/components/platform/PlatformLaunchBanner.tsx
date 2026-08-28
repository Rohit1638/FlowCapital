"use client";

import Link from "next/link";
import { ArrowRight, Factory, Landmark } from "lucide-react";
import { motion } from "framer-motion";

export function PlatformLaunchBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.5rem] border border-lime/40 bg-ink p-6 text-white md:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime">New · Module 6A</p>
      <h2 className="mt-2 font-display text-2xl font-semibold md:text-3xl">
        Manufacturer & Lender Platform
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
        Two-sided supply-chain financing: create production requests, pledge collateral, underwrite with confidence-gated
        decisions, and get AI explanations — without replacing this Command Center.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-sm font-semibold text-ink hover:bg-lime-deep"
        >
          <Factory className="h-4 w-4" />
          Open platform login
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/manufacturer/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/5"
        >
          Manufacturer demo
        </Link>
        <Link
          href="/lender/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/5"
        >
          <Landmark className="h-4 w-4" />
          Lender demo
        </Link>
      </div>
    </motion.div>
  );
}
