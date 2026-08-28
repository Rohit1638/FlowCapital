import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ManufacturerContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1400px]", className)}>{children}</div>;
}

export function ManufacturerSection({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      {title ? <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2> : null}
      {children}
    </section>
  );
}
