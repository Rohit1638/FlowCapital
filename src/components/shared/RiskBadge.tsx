import type { RiskLevel } from "@/types/asset";
import { cn } from "@/lib/utils";

const styles: Record<RiskLevel, string> = {
  LOW: "bg-lime/25 text-ink",
  MEDIUM: "bg-[#f0e6c8] text-ink",
  HIGH: "bg-[#17181F] text-lime",
  CRITICAL: "bg-[#d4483a] text-white",
  CLOSED: "bg-muted text-muted-foreground",
};

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        styles[level],
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          level === "LOW" && "bg-[#6aa32a]",
          level === "MEDIUM" && "bg-[#c28a16]",
          level === "HIGH" && "bg-lime",
          level === "CRITICAL" && "bg-white",
          level === "CLOSED" && "bg-muted-foreground",
        )}
      />
      {level}
    </span>
  );
}
