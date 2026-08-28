import type { IntegrationEvent } from "@/types/integration";
import { cn } from "@/lib/utils";

export function ProcessingPipeline({ event }: { event: IntegrationEvent }) {
  return (
    <ol className="space-y-0">
      {event.processingSteps.map((recorded, index) => (
        <li key={`${recorded.key}-${index}`} className="flex gap-3">
          <div className="flex w-6 flex-col items-center">
            <span
              className={cn(
                "mt-1 h-3 w-3 rounded-full",
                recorded.status === "passed" && "bg-lime",
                recorded.status === "failed" && "bg-[#d4483a]",
                recorded.status === "stopped" && "bg-ink",
                recorded.status === "pending" && "bg-foreground/20",
              )}
              aria-hidden
            />
            {index < event.processingSteps.length - 1 ? (
              <span className="my-1 w-px flex-1 min-h-6 bg-foreground/15" />
            ) : null}
          </div>
          <div className="pb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.08em]">
              {recorded.label}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{recorded.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
