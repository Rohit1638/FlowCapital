import type { DecisionExplanation } from "@/types/decisions";

export function DecisionExplainability({ explanation }: { explanation: DecisionExplanation }) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <article className="rounded-[1.5rem] bg-ink p-5 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lime">Supporting signals</p>
        <ul className="mt-4 space-y-3">
          {explanation.supporting.length > 0 ? (
            explanation.supporting.map((item) => (
              <li key={item.id} className="text-sm leading-6 text-white/80">
                + {item.text}
              </li>
            ))
          ) : (
            <li className="text-sm text-white/50">No material supporting signals.</li>
          )}
        </ul>
      </article>
      <article className="rounded-[1.5rem] border border-foreground/10 bg-white p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Blocking signals</p>
        <ul className="mt-4 space-y-3">
          {explanation.blocking.length > 0 ? (
            explanation.blocking.map((item) => (
              <li key={item.id} className="text-sm leading-6 text-ink/75">
                − {item.text}
              </li>
            ))
          ) : (
            <li className="text-sm text-muted-foreground">No material blockers on the current evidence pack.</li>
          )}
        </ul>
      </article>
    </section>
  );
}
