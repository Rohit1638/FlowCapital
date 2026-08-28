"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AIInsight } from "@/types/financing";

export function AIInsightCard({ insight }: { insight: AIInsight }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="relative overflow-hidden rounded-[1.6rem] bg-ink p-6 text-white md:p-7"
    >
      <div className="insight-pulse absolute right-6 top-6 h-2.5 w-2.5 rounded-full bg-lime" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
        {insight.heading}
      </p>
      <h3 className="mt-4 max-w-sm font-display text-2xl font-semibold leading-snug tracking-tight">
        {insight.recommendation}
      </h3>
      <div className="mt-5 flex items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Confidence
          </p>
          <p className="mt-1 font-display text-4xl font-bold text-lime">{insight.confidence}%</p>
        </div>
        <p className="max-w-[16rem] text-right text-xs text-white/45">
          Instrument suggested
          <span className="mt-1 block font-semibold text-white">In-Transit Financing</span>
        </p>
      </div>
      <p className="mt-5 text-sm leading-6 text-white/70">{insight.reasoning}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="lime" size="sm">
          <Link href="/intelligence">
            View Decision
            <ArrowUpRight />
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="border-white/15 text-white hover:bg-white/5">
          <Link href={`/assets/${insight.assetId}`}>Review Asset</Link>
        </Button>
      </div>
    </motion.div>
  );
}
