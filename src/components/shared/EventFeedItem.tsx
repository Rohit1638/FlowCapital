"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Factory,
  FileText,
  Package,
  Shield,
  Truck,
  Wallet,
} from "lucide-react";
import type { LifecycleEvent } from "@/types/event";
import { formatRelativeTime } from "@/lib/format";
import { staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

const icons = {
  shipment: Truck,
  warehouse: Package,
  invoice: FileText,
  production: Factory,
  risk: Shield,
  financing: Wallet,
  procurement: ClipboardCheck,
  verification: CheckCircle2,
  physical: Factory,
  contract: FileText,
};

const severityDot: Record<LifecycleEvent["severity"], string> = {
  info: "bg-white/50",
  success: "bg-lime",
  warning: "bg-[#f0c75e]",
  critical: "bg-[#ff6b5a]",
};

export function EventFeedItem({ event, index }: { event: LifecycleEvent; index: number }) {
  const Icon =
    event.category === "risk" && event.severity === "critical"
      ? AlertTriangle
      : icons[event.category];

  return (
    <motion.div
      variants={staggerItem}
      custom={index}
      className="flex gap-3 rounded-2xl border border-white/8 bg-white/4 px-3.5 py-3"
    >
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/6">
        <Icon className="h-4 w-4 text-lime" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-white">{event.title}</p>
          <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", severityDot[event.severity])} />
        </div>
        <p className="mt-1 text-xs text-white/45">
          {event.assetId} · {formatRelativeTime(event.timestamp)}
        </p>
      </div>
    </motion.div>
  );
}
