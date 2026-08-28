const features = [
  {
    key: "01",
    title: "TRACK",
    copy: "Every asset gets a persistent Digital Asset Twin.",
    detail: "Physical state, contractual terms, and financing history stay attached to the same identity from PO to cash.",
    tone: "light" as const,
  },
  {
    key: "02",
    title: "DECIDE",
    copy: "Intelligence continuously evaluates value, risk, and financing needs.",
    detail: "Recommendations update as events land — not as a static credit file reviewed weeks later.",
    tone: "lime" as const,
  },
  {
    key: "03",
    title: "TRANSITION",
    copy: "Financing evolves as the physical asset moves toward cash realisation.",
    detail: "Instruments can continue, increase, reduce, refinance, or settle without losing the asset’s financial memory.",
    tone: "dark" as const,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto w-full max-w-6xl scroll-mt-24 px-5 py-16 md:px-8">
      <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        How FlowCapital works
      </p>
      <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold tracking-tight md:text-5xl">
        One continuous layer. Three precise motions.
      </h2>
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.key}
            className={
              feature.tone === "light"
                ? "rounded-[1.6rem] border border-foreground/10 bg-white p-7"
                : feature.tone === "lime"
                  ? "rounded-[1.6rem] bg-lime p-7 text-ink"
                  : "rounded-[1.6rem] bg-ink p-7 text-white"
            }
          >
            <p
              className={
                feature.tone === "dark"
                  ? "text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40"
                  : "text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/45"
              }
            >
              {feature.key}
            </p>
            <h3 className="mt-8 font-display text-3xl font-semibold tracking-tight">{feature.title}</h3>
            <p className="mt-4 text-lg font-medium leading-7">{feature.copy}</p>
            <p
              className={
                feature.tone === "dark" ? "mt-4 text-sm leading-6 text-white/55" : "mt-4 text-sm leading-6 text-ink/60"
              }
            >
              {feature.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
