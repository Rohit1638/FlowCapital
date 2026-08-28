import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-full border border-foreground/12 bg-white px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-foreground/30",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
