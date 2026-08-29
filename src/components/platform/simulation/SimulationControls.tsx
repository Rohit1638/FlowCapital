"use client";

import { AlertTriangle, Loader2, Pause, Play, RotateCcw, SkipForward, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SimulationState } from "@/types/simulation";

interface SimulationControlsProps {
  state: SimulationState;
  loading: boolean;
  onStart: () => void;
  onNext: () => void;
  onAuto: () => void;
  onPause: () => void;
  onReset: () => void;
}

export function SimulationControls({
  state,
  loading,
  onStart,
  onNext,
  onAuto,
  onPause,
  onReset,
}: SimulationControlsProps) {
  const isReady = state.status === "READY";
  const isCompleted = state.status === "COMPLETED";
  const isAuto = state.mode === "AUTO" && state.status === "RUNNING";

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {isReady ? (
        <Button variant="lime" disabled={loading} onClick={onStart} className="min-w-[160px] font-semibold">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
          Start simulation
        </Button>
      ) : null}

      {!isReady && !isCompleted ? (
        <>
          <Button variant="lime" disabled={loading || state.processing} onClick={onNext} className="font-semibold">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SkipForward className="mr-2 h-4 w-4" />}
            Simulate next event
          </Button>
          {!isAuto ? (
            <Button variant="outline" disabled={loading} onClick={onAuto}>
              <Play className="mr-2 h-4 w-4" />
              Auto run
            </Button>
          ) : (
            <Button variant="outline" disabled={loading} onClick={onPause}>
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          )}
        </>
      ) : null}

      {isCompleted ? (
        <Button variant="lime" disabled={loading} onClick={onReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Replay simulation
        </Button>
      ) : (
        <Button variant="ghost" disabled={loading || isReady} onClick={onReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      )}
    </div>
  );
}

export function SimulationResetDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[1.25rem] border border-foreground/10 bg-white p-6 shadow-xl">
        <div className="flex items-center gap-2 text-amber-700">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="font-display text-lg font-semibold">Reset simulation?</h3>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          This clears simulation events and restores the initial lifecycle state. Real production and financing records are not affected.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button variant="lime" onClick={onConfirm}>Confirm reset</Button>
        </div>
      </div>
    </div>
  );
}
