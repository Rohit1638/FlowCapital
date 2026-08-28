import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  eyebrow?: string;
  title: string;
  description: string;
  visual?: ReactNode;
  className?: string;
}

export function EmptyState({
  eyebrow,
  title,
  description,
  visual,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "mt-8 overflow-hidden rounded-[1.6rem] border border-foreground/10 bg-white",
        className,
      )}
    >
      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="p-8 md:p-10">
          {eyebrow ? (
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">
            Connected in a later module
          </p>
        </div>
        <div className="border-t border-foreground/10 bg-ink p-8 text-white lg:border-l lg:border-t-0">
          {visual}
        </div>
      </div>
    </div>
  );
}
