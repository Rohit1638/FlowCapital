"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroFlowVisual } from "@/components/landing/HeroFlowVisual";
import { fadeUp } from "@/lib/motion";

export function LandingHero() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 pb-16 pt-6 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-24 lg:pt-10">
      <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.55 }}>
        <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-ink/50">
          Supply-chain financial intelligence
        </p>
        <h1 className="mt-4 max-w-xl font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-[4.1rem]">
          Capital should move as fast as your supply chain.
        </h1>
        <p className="mt-6 max-w-lg text-base leading-7 text-ink/65 md:text-lg">
          FlowCapital AI creates a living financial layer for every physical asset, continuously
          connecting asset movement, value, risk, and financing decisions from purchase order to
          cash realisation.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild variant="dark" size="lg">
            <Link href="/login?portal=1">
              Enter platform
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="#how-it-works">Explore the Flow</a>
          </Button>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.12 }}
      >
        <HeroFlowVisual />
      </motion.div>
    </section>
  );
}
