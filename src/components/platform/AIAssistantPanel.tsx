"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { platformFetch, platformFetchAuth } from "@/lib/platform/client";
import { cn } from "@/lib/utils";
import type { AIInsightResponse } from "@/types/platform";

const QUICK_ACTIONS = [
  "Why is my confidence score 68?",
  "What is blocking my financing?",
  "How can I improve my financeability?",
  "What changed in my latest production event?",
  "Summarize my financing request.",
  "Which documents are missing?",
  "What should I do next?",
];

export function AIAssistantPanel({
  token,
  role,
  productionRequestId,
  quickActions = QUICK_ACTIONS,
  theme = "light",
}: {
  token: string;
  role: "MANUFACTURER" | "LENDER";
  productionRequestId?: string;
  quickActions?: string[];
  theme?: "light" | "dark";
}) {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<AIInsightResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiOnline, setAiOnline] = useState<boolean | null>(null);
  const [lastPrompt, setLastPrompt] = useState("");

  useEffect(() => {
    platformFetch<{ available: boolean; provider: string }>("/ai/health")
      .then((h) => setAiOnline(h.available))
      .catch(() => setAiOnline(false));
  }, []);

  const ask = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setLastPrompt(prompt);
    try {
      const path = role === "LENDER" ? "/ai/lender/underwriting-brief" : "/ai/manufacturer/insight";
      const body = JSON.stringify({ question: prompt, production_request_id: productionRequestId });
      const result = await platformFetchAuth<AIInsightResponse>(token, path, { method: "POST", body });
      setResponse(result);
      setQuestion(prompt);
      if (result.fallback_used) {
        setError(null);
      }
    } catch {
      setError("FlowCapital AI could not reach the intelligence service. Please try again.");
      setResponse(null);
    } finally {
      setLoading(false);
    }
  }, [role, productionRequestId, token]);

  return (
    <div className={cn("rounded-[1.25rem] border p-6", theme === "dark" ? "border-white/10 bg-white/5 text-white" : "border-foreground/10 bg-white")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-lime-deep" />
          <h3 className="font-display text-xl font-semibold">{role === "LENDER" ? "AI Underwriting Brief" : "Flow Assistant"}</h3>
        </div>
        {aiOnline !== null ? (
          <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide", aiOnline ? "bg-lime/25 text-ink" : "bg-muted text-muted-foreground")}>
            {aiOnline ? "AI Online" : "AI Connection Issue"}
          </span>
        ) : null}
      </div>
      <p className={cn("mt-2 text-sm", theme === "dark" ? "text-white/60" : "text-muted-foreground")}>
        Structured insights on confidence, funding readiness, and lifecycle evidence.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {quickActions.map((action) => (
          <button key={action} type="button" onClick={() => ask(action)} disabled={loading} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium disabled:opacity-50", theme === "dark" ? "border-white/15 hover:bg-white/10" : "border-foreground/10 hover:bg-lime/20")}>
            {action}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about confidence, funding, or next steps…"
          className={cn("flex-1 rounded-xl border px-4 py-2 text-sm", theme === "dark" ? "border-white/15 bg-white/5 text-white placeholder:text-white/40" : "border-foreground/10")}
          onKeyDown={(e) => e.key === "Enter" && ask(question)}
        />
        <Button onClick={() => ask(question)} disabled={loading || !question.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ask"}
        </Button>
      </div>

      {loading ? (
        <p className={cn("mt-4 text-sm", theme === "dark" ? "text-white/60" : "text-muted-foreground")}>Connecting to FlowCapital AI…</p>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm">
          <p className="text-destructive">{error}</p>
          <button type="button" onClick={() => ask(lastPrompt || question)} className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-ink hover:underline">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      ) : null}

      {response && !error ? (
        <div className={cn("mt-4 rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap", theme === "dark" ? "bg-ink/60" : "bg-surface-2")}>
          {response.content}
          {response.fallback_used ? (
            <p className="mt-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">Using deterministic fallback insights</p>
          ) : (
            <p className="mt-3 text-xs uppercase tracking-[0.14em] text-lime-deep">Powered by {response.provider}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
