import { cn } from "@/lib/utils";

const sizeConfig = {
  sm: {
    mark: "h-8 w-8",
    name: "text-[11px] tracking-[0.16em]",
    ai: "text-[9px] tracking-[0.28em]",
    gap: "gap-2",
  },
  md: {
    mark: "h-9 w-9",
    name: "text-[13px] tracking-[0.18em]",
    ai: "text-[11px] tracking-[0.32em]",
    gap: "gap-2.5",
  },
  lg: {
    mark: "h-12 w-12",
    name: "text-[15px] tracking-[0.2em]",
    ai: "text-[12px] tracking-[0.36em]",
    gap: "gap-3",
  },
} as const;

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <rect x="1" y="1" width="38" height="38" rx="11" fill="#0A0A0A" />
      <path
        d="M11.5 27C11.5 20.2 16.4 14.5 23 14.5H28.5"
        stroke="#F5F5F2"
        strokeWidth="2.15"
        strokeLinecap="round"
      />
      <path
        d="M11.5 21.5H21.8"
        stroke="#B9FF66"
        strokeWidth="2.15"
        strokeLinecap="round"
      />
      <circle cx="26.8" cy="21.5" r="2.2" fill="#B9FF66" />
    </svg>
  );
}

export function BrandTitle({
  inverted = false,
  size = "md",
  className,
}: {
  inverted?: boolean;
  size?: keyof typeof sizeConfig;
  className?: string;
}) {
  const s = sizeConfig[size];
  return (
    <div className={cn("leading-none", className)}>
      <p
        className={cn(
          "font-display font-bold uppercase",
          s.name,
          inverted ? "text-white" : "text-ink",
        )}
      >
        FLOWCAPITAL
      </p>
      <p
        className={cn(
          "mt-0.5 font-display font-normal uppercase",
          s.ai,
          inverted ? "text-lime" : "text-muted-foreground",
        )}
      >
        AI
      </p>
    </div>
  );
}

export function BrandWordmark({
  inverted = false,
  compact = false,
  size = "md",
  className,
}: {
  inverted?: boolean;
  compact?: boolean;
  size?: keyof typeof sizeConfig;
  className?: string;
}) {
  const s = sizeConfig[size];

  return (
    <div className={cn("flex items-center", s.gap, className)}>
      <LogoMark className={s.mark} />
      {!compact ? <BrandTitle inverted={inverted} size={size} /> : null}
    </div>
  );
}
