"use client";

import { motion } from "framer-motion";
import {
  Factory,
  Network,
  Package,
  ShieldCheck,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { CONNECTORS, type ConnectorIconKey } from "@/lib/integration/connectors";
import { cn } from "@/lib/utils";

const ICONS: Record<ConnectorIconKey, LucideIcon> = {
  erp: Network,
  production: Factory,
  warehouse: Package,
  logistics: Truck,
  finance: Wallet,
  verification: ShieldCheck,
};

export function IntegrationArchitecture() {
  return (
    <section className="overflow-hidden rounded-[1.6rem] bg-ink p-6 text-white md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lime">Simulated live data</p>
          <h2 className="mt-2 max-w-xl font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Six enterprise systems. One event engine. One twin.
          </h2>
        </div>
        <span className="rounded-full border border-lime/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-lime">
          Demo connected
        </span>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
        The same pipeline can later attach to real APIs, webhooks, ERP, WMS, and logistics providers.
        Nothing here is a live company connection.
      </p>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_auto_0.9fr] xl:items-center">
        <div className="space-y-2">
          {CONNECTORS.map((connector, index) => {
            const Icon = ICONS[connector.icon];
            return (
              <div key={connector.id} className="flex items-center gap-3">
                <span className="flex w-[9.5rem] items-center gap-2 text-xs uppercase tracking-wide text-white/55">
                  <Icon className="h-3.5 w-3.5 text-lime" />
                  {connector.id}
                </span>
                <div className="relative h-px flex-1 overflow-hidden bg-white/15">
                  <motion.span
                    className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-lime shadow-[0_0_12px_#b9ff66]"
                    animate={{ left: ["0%", "100%"] }}
                    transition={{ duration: 2.6, delay: index * 0.18, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="relative rounded-[1.3rem] border border-lime/40 bg-white/5 px-6 py-7 text-center">
          <motion.span
            className="absolute inset-3 rounded-[1rem] border border-lime/20"
            animate={{ opacity: [0.2, 0.55, 0.2] }}
            transition={{ duration: 2.8, repeat: Infinity }}
          />
          <p className="relative text-[11px] uppercase tracking-[0.18em] text-lime">FlowCapital</p>
          <p className="relative mt-2 font-display text-xl font-semibold">Event Engine</p>
          <p className="relative mt-2 text-xs text-white/45">Normalize · Validate · Reconcile</p>
        </div>
        <div className="rounded-[1.3rem] border border-white/10 bg-white/5 px-6 py-7">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Writes to</p>
          <p className="mt-2 font-display text-xl font-semibold">Digital Asset Twins</p>
          <p className="mt-2 text-sm leading-6 text-white/50">
            One persistent identity per physical asset — updated only after the event is trusted.
          </p>
        </div>
      </div>
    </section>
  );
}

export function ConnectorGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {CONNECTORS.map((connector) => {
        const Icon = ICONS[connector.icon];
        return (
          <article
            key={connector.id}
            className={cn(
              "flex min-h-[230px] flex-col justify-between rounded-[1.5rem] p-6",
              connector.tone === "dark" && "bg-ink text-white",
              connector.tone === "lime" && "bg-lime text-ink",
              connector.tone === "light" && "border border-foreground/10 bg-white",
            )}
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "inline-flex h-10 w-10 items-center justify-center rounded-full",
                    connector.tone === "dark" && "bg-white/8 text-lime",
                    connector.tone === "lime" && "bg-ink text-lime",
                    connector.tone === "light" && "bg-[#f4f4f0] text-ink",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <p
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-[0.16em]",
                    connector.tone === "dark" ? "text-lime" : "text-ink/45",
                  )}
                >
                  {connector.statusLabel}
                </p>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold leading-tight">{connector.name}</h3>
              <p className={cn("mt-2 text-sm leading-6", connector.tone === "dark" ? "text-white/55" : "text-ink/60")}>
                {connector.purpose}
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <p>
                <span className="block text-[11px] uppercase tracking-wide opacity-50">Health</span>
                {connector.health.toFixed(1)}%
              </p>
              <p>
                <span className="block text-[11px] uppercase tracking-wide opacity-50">Events</span>
                {connector.eventsProcessed.toLocaleString("en-IN")}
              </p>
              <p>
                <span className="block text-[11px] uppercase tracking-wide opacity-50">Last sync</span>
                {connector.lastSync}
              </p>
              <p>
                <span className="block text-[11px] uppercase tracking-wide opacity-50">Confidence</span>
                {connector.confidence}%
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
