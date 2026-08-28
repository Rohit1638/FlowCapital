const memory = [
  { stage: "Purchase Order", finance: "Unfinanced", value: "₹28.4L" },
  { stage: "Production", finance: "Inventory facility", value: "₹42.5L" },
  { stage: "In Transit", finance: "In-transit financing", value: "₹31.8L" },
  { stage: "Invoice", finance: "Receivable discounting", value: "₹51.3L" },
  { stage: "Cash Realised", finance: "Settled", value: "₹44.0L" },
];

export function FinancialMemory() {
  return (
    <section id="memory" className="bg-ink text-white">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 md:px-8 md:py-24">
        <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-lime">
          One asset. One financial memory.
        </p>
        <h2 className="mt-4 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
          The twin does not reset when the box moves.
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-7 text-white/60">
          The same Digital Asset Twin carries physical state, contractual state, current value,
          risk, and financing history through every stage — so capital can transition without
          losing context.
        </p>

        <div className="mt-12 overflow-hidden rounded-[1.6rem] border border-white/10">
          {memory.map((row, index) => (
            <div
              key={row.stage}
              className="grid grid-cols-1 items-center gap-2 border-b border-white/10 px-5 py-5 last:border-b-0 sm:grid-cols-[1.1fr_1.2fr_0.6fr] sm:px-7"
            >
              <p className="font-display text-xl font-semibold">
                <span className="mr-3 text-lime">{String(index + 1).padStart(2, "0")}</span>
                {row.stage}
              </p>
              <p className="text-sm text-white/60">{row.finance}</p>
              <p className="font-medium text-lime sm:text-right">{row.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
