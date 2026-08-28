import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={cn("h-9 w-9", className)}
    >
      <rect x="1" y="1" width="38" height="38" rx="12" fill="#17181F" />
      <path
        d="M11 26.5C11 19.5 16.2 14 23.1 14H29"
        stroke="#F4F4F0"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M11 21.2H22.4"
        stroke="#B9FF66"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="27.4" cy="21.2" r="2.3" fill="#B9FF66" />
    </svg>
  );
}

export function BrandWordmark({
  inverted = false,
  compact = false,
}: {
  inverted?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      {!compact ? (
        <div className="leading-none">
          <p
            className={cn(
              "font-display text-[13px] font-bold tracking-[0.18em]",
              inverted ? "text-white" : "text-ink",
            )}
          >
            FLOWCAPITAL
          </p>
          <p
            className={cn(
              "mt-0.5 font-display text-[11px] font-semibold tracking-[0.32em]",
              inverted ? "text-lime" : "text-ink/55",
            )}
          >
            AI
          </p>
        </div>
      ) : null}
    </div>
  );
}
