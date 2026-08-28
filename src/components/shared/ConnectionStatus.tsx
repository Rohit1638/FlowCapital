"use client";

import { useConnection } from "@/lib/data/connection";
import { cn } from "@/lib/utils";

export function ConnectionStatus() {
  const { mode } = useConnection();
  const label = mode === "cloud" ? "Cloud-connected" : mode === "checking" ? "Checking source" : "Demo data mode";

  return (
    <div className="hidden items-center rounded-full border border-foreground/10 bg-white px-3 py-1.5 md:flex">
      <span
        className={cn(
          "mr-2 h-1.5 w-1.5 rounded-full",
          mode === "cloud" ? "bg-lime" : mode === "checking" ? "bg-[#c28a16]" : "bg-muted-foreground",
        )}
      />
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/55">{label}</p>
    </div>
  );
}
