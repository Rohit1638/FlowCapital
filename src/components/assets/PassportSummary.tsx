"use client";

import { motion } from "framer-motion";
import type { Asset } from "@/types/asset";
import { formatCurrencyINR } from "@/lib/format";
import { staggerContainer, staggerItem } from "@/lib/motion";

export function PassportSummary({ asset }: { asset: Asset }) {
  const production = asset.physical.productionCompletion;

  return (
    <motion.div
      key={`${asset.currentValue}-${production}`}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid gap-4 lg:grid-cols-12"
    >
      <motion.div variants={staggerItem} className="rounded-[1.5rem] bg-ink p-6 text-white lg:col-span-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Current value</p>
        <p className="mt-4 font-display text-5xl font-semibold tracking-tight text-lime">
          {formatCurrencyINR(asset.currentValue, 2)}
        </p>
        <p className="mt-3 text-sm text-white/50">
          Original PO {formatCurrencyINR(asset.originalValue, 2)} · same twin ID throughout.
        </p>
      </motion.div>
      <motion.div variants={staggerItem} className="rounded-[1.5rem] border border-foreground/10 bg-white p-6 lg:col-span-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Capital deployed</p>
        <p className="mt-6 font-display text-3xl font-semibold">{formatCurrencyINR(asset.financedAmount, 2)}</p>
      </motion.div>
      <div className="grid gap-4 lg:col-span-3">
        <motion.div variants={staggerItem} className="rounded-[1.5rem] bg-lime p-5 text-ink">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/55">Available financing</p>
          <p className="mt-3 font-display text-2xl font-semibold">{formatCurrencyINR(asset.availableFinancing, 2)}</p>
        </motion.div>
        <motion.div variants={staggerItem} className="rounded-[1.5rem] border border-foreground/10 bg-white p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Production</p>
          <p className="mt-3 font-display text-2xl font-semibold">{production}%</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full bg-ink"
              initial={{ width: 0 }}
              animate={{ width: `${production}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
