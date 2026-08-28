import type { DataSource } from "@/types/asset";
import { cn } from "@/lib/utils";

export function DataSourceConfidence({ sources }: { sources: DataSource[] }) {
  return (
    <section className="rounded-[1.6rem] border border-foreground/10 bg-white p-5 md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Data source confidence
      </p>
      <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">Where this twin is reading from</h2>
      <div className="mt-5 space-y-3">
        {sources.map((source) => (
          <div key={source.id} className="flex items-center justify-between gap-4 rounded-2xl bg-[#f4f4f0] px-4 py-3">
            <div>
              <p className="text-sm font-medium">{source.name}</p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {source.applicable ? source.status.replaceAll("_", " ") : "Not yet applicable"}
              </p>
            </div>
            <p className={cn("font-display text-xl font-semibold", source.applicable ? "text-ink" : "text-ink/30")}>
              {source.applicable ? `${source.confidence}%` : "—"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
