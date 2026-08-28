import type { AssetDecisionRecord, PortfolioDecisionSummary } from "@/types/decisions";
import { AnimatedNumber } from "@/components/intelligence/AnimatedNumber";
import { formatCurrencyINR } from "@/lib/format";

export function DecisionSummary({
  summary,
  top,
}: {
  summary: PortfolioDecisionSummary;
  top: AssetDecisionRecord | null;
}) {
  const cards = [
    { label: "Safe financing potential", value: summary.totalSafeFinancing, ink: true },
    { label: "Ready for priority funding", value: summary.priorityFundingPotential, lime: true },
    { label: "Capital requiring conditions", value: summary.conditionalCapital, ink: false },
    { label: "Capital blocked by issues", value: summary.blockedCapital, ink: false },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.label}
          className={`rounded-[1.5rem] p-5 ${card.lime ? "bg-lime text-ink" : card.ink ? "bg-ink text-white" : "border border-foreground/10 bg-white"}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-60">{card.label}</p>
          <p className="mt-4 font-display text-3xl font-semibold">
            <AnimatedNumber value={card.value} />
          </p>
        </article>
      ))}
      <article className="rounded-[1.5rem] border border-foreground/10 bg-white p-5 md:col-span-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Assets ready now</p>
        <p className="mt-3 font-display text-3xl font-semibold">{String(summary.assetsReadyNow).padStart(2, "0")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {String(summary.assetsRequiringAttention).padStart(2, "0")} requiring attention · {summary.priorityCount} priority ·{" "}
          {summary.conditionalCount} conditional · {summary.holdCount} hold
        </p>
      </article>
      <article className="rounded-[1.5rem] bg-ink p-5 text-white md:col-span-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-lime">Highest priority action</p>
        <p className="mt-3 text-sm leading-6 text-white/80">{summary.highestPriorityAction}</p>
        {top ? (
          <p className="mt-3 font-mono text-xs text-white/40">
            Top ranked · {top.assetId} · {formatCurrencyINR(top.maximumSafeFinancing, 2)}
          </p>
        ) : null}
      </article>
    </div>
  );
}
