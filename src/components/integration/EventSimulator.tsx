"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DEMO_SCENARIOS } from "@/lib/integration/scenarios";
import {
  duplicateLastApplied,
  playScenarioStep,
  resetAllDemoData,
  resetScenario,
  selectScenario,
  setPlaying,
  startSimulation,
  useIntegrationState,
} from "@/lib/integration/store";
import { cn } from "@/lib/utils";

export function EventSimulator() {
  const state = useIntegrationState();
  const [speed, setSpeed] = useState<"normal" | "fast">("normal");
  const scenario = DEMO_SCENARIOS.find((item) => item.id === state.scenarioId);
  const delay = speed === "fast" ? 700 : 1600;
  const playing = state.playing;
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    timer.current = window.setTimeout(() => {
      playScenarioStep();
    }, delay);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [playing, state.scenarioCursor, delay]);

  const complete = Boolean(scenario && state.scenarioCursor >= scenario.steps.length);

  return (
    <section className="rounded-[1.6rem] border border-ink/10 bg-[#ecece6] p-5 md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/45">Event simulation</p>
      <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">Replay prepared supply-chain signals</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Demo-connected only. Each step runs the local pipeline: ingest → normalize → match → validate →
        reconcile → apply or reject.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {DEMO_SCENARIOS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => selectScenario(item.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide",
              state.scenarioId === item.id ? "bg-ink text-white" : "bg-white text-ink/70",
            )}
          >
            {item.name}
          </button>
        ))}
      </div>
      {scenario ? <p className="mt-3 text-sm leading-6 text-ink/70">{scenario.summary}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {(["normal", "fast"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setSpeed(value)}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
              speed === value ? "bg-lime text-ink" : "bg-white text-ink/60",
            )}
          >
            {value} speed
          </button>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="button" variant="lime" onClick={() => startSimulation()} disabled={!scenario || playing || complete}>
          Start simulation
        </Button>
        <Button type="button" variant="dark" onClick={() => playScenarioStep()} disabled={!scenario || complete}>
          Next event
        </Button>
        <Button type="button" variant="outline" onClick={() => setPlaying(true)} disabled={!scenario || playing || complete}>
          Auto play
        </Button>
        <Button type="button" variant="outline" onClick={() => setPlaying(false)} disabled={!playing}>
          Pause
        </Button>
        <Button type="button" variant="outline" onClick={() => resetScenario()} disabled={!scenario}>
          Reset scenario
        </Button>
        <Button type="button" variant="outline" onClick={() => duplicateLastApplied("DA-2026-001")}>
          Replay last 001 event
        </Button>
        <Button type="button" variant="outline" onClick={() => resetAllDemoData()}>
          Reset all demo data
        </Button>
      </div>
      <p className="mt-3 text-xs uppercase tracking-[0.14em] text-ink/40">
        {scenario
          ? complete
            ? "Scenario complete"
            : `Step ${state.scenarioCursor + 1} / ${scenario.steps.length} · ${scenario.steps[state.scenarioCursor]?.title ?? ""}`
          : "Select a scenario"}
      </p>
      <p className="mt-2 text-xs leading-5 text-ink/45">
        Use Reset all demo data before replaying a scenario from the original twin state. Replay last 001 event
        demonstrates duplicate prevention.
      </p>
    </section>
  );
}
