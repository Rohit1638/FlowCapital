"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { platformFetchAuth } from "@/lib/platform/client";
import { DEMO_REQUEST_ID } from "@/lib/platform/demo-fallback";
import type { ReassessmentRecord } from "@/types/platform";
import type { SimulationEvent, SimulationState } from "@/types/simulation";

const POLL_MS = 2500;
const AUTO_DELAY_MS = 2800;

export function useSimulation(token: string | null, requestId = DEMO_REQUEST_ID) {
  const [state, setState] = useState<SimulationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<SimulationEvent | null>(null);
  const [lastReassessment, setLastReassessment] = useState<ReassessmentRecord | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await platformFetchAuth<SimulationState>(token, `/simulation/${requestId}`);
      setState(data);
      setError(null);
    } catch {
      setError("Unable to load simulation state.");
    } finally {
      setLoading(false);
    }
  }, [token, requestId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!token || !state || state.status === "READY") return;
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [token, state?.status, state?.updated_at, load]);

  const runAction = useCallback(
    async (path: string, method = "POST") => {
      if (!token || actionLoading) return null;
      setActionLoading(true);
      setError(null);
      try {
        const res = await platformFetchAuth<{
          state?: SimulationState;
          event?: SimulationEvent;
          reassessment?: ReassessmentRecord | null;
        } | SimulationState>(token, `/simulation/${requestId}${path}`, { method }, 30000);
        const next = "state" in res && res.state ? res.state : (res as SimulationState);
        setState(next);
        if ("reassessment" in res && res.reassessment) {
          setLastReassessment(res.reassessment);
        }
        if ("event" in res && res.event) {
          setLastEvent(res.event);
          setShowEventModal(true);
        } else if (next.latest_event && path === "/next") {
          setLastEvent(next.latest_event);
          setShowEventModal(true);
        }
        return next;
      } catch {
        setError("Unable to generate the next event.");
        return null;
      } finally {
        setActionLoading(false);
      }
    },
    [token, requestId, actionLoading],
  );

  const start = () => runAction("/start");
  const next = () => runAction("/next");
  const pause = () => runAction("/pause");
  const resume = () => runAction("/resume");
  const reset = () => runAction("/reset");
  const enableAuto = () => runAction("/auto?enabled=true");
  const disableAuto = () => runAction("/auto?enabled=false");

  useEffect(() => {
    if (autoTimer.current) {
      clearInterval(autoTimer.current);
      autoTimer.current = null;
    }
    if (!state || state.mode !== "AUTO" || state.status !== "RUNNING" || actionLoading) return;

    autoTimer.current = setInterval(() => {
      if (state.stage_index >= 6 || state.status === "COMPLETED") {
        disableAuto();
        return;
      }
      next();
    }, AUTO_DELAY_MS);

    return () => {
      if (autoTimer.current) clearInterval(autoTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.mode, state?.status, state?.stage_index, actionLoading]);

  return {
    state,
    loading,
    actionLoading,
    error,
    lastEvent,
    lastReassessment,
    showEventModal,
    setShowEventModal,
    reload: load,
    start,
    next,
    pause,
    resume,
    reset,
    enableAuto,
    disableAuto,
  };
}
