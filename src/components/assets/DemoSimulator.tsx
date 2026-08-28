"use client";

import { Button } from "@/components/ui/button";
import type { DemoStep } from "@/lib/demo-simulator";

export function DemoSimulator({
  step,
  onStep,
  onReset,
}: {
  step: DemoStep;
  onStep: (step: Exclude<DemoStep, 0>) => void;
  onReset: () => void;
}) {
  return (
    <section className="rounded-[1.6rem] border border-ink/15 bg-[#ecece6] p-5 md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/45">Demo simulation</p>
      <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
        Simulate the next verified supply-chain event.
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        Local prototype only. These actions update a simulated overlay for DA-2026-001 and persist in
        this browser. Base demo data is never mutated.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="button" variant="dark" onClick={() => onStep(1)} disabled={step !== 0}>
          Production reaches 80%
        </Button>
        <Button type="button" variant="dark" onClick={() => onStep(2)} disabled={step !== 1}>
          Production completed
        </Button>
        <Button type="button" variant="lime" onClick={() => onStep(3)} disabled={step !== 2}>
          Move to Finished Goods
        </Button>
        <Button type="button" variant="outline" onClick={onReset} disabled={step === 0}>
          Reset demo scenario
        </Button>
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.14em] text-ink/40">
        Step {step} of 3 · overlay stored locally
      </p>
    </section>
  );
}
