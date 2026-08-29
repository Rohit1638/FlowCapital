"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { formatINRCompact } from "@/lib/format";
import type { MarketplaceContext, ProductionRequest } from "@/types/platform";
import { cn } from "@/lib/utils";

interface LenderOfferPanelProps {
  request: ProductionRequest;
  marketplace: MarketplaceContext;
  loading: boolean;
  onSubmit: (payload: {
    offered_amount: number;
    interest_rate: number;
    tenor_days: number;
    instrument_type: string;
    conditions: string[];
    notes?: string;
  }) => Promise<void>;
}

const INSTRUMENTS = ["PRODUCTION_FINANCE", "INVENTORY_FINANCE", "RECEIVABLES_FINANCE", "BRIDGE_FINANCE"];

export function LenderOfferPanel({ request, marketplace, loading, onSubmit }: LenderOfferPanelProps) {
  const existing = marketplace.my_offer;
  const maxSafe = marketplace.recommended_amount_max ?? marketplace.remaining_available_capacity ?? marketplace.maximum_safe_financing ?? request.financeable_value;
  const minRec = marketplace.recommended_amount_min ?? maxSafe * 0.4;

  const defaults = useMemo(() => {
    const appetite = marketplace.lender_profile?.risk_appetite ?? "BALANCED";
    const cap = marketplace.remaining_available_capacity ?? maxSafe;
    if (existing) {
      return {
        amount: existing.offered_amount,
        rate: existing.interest_rate,
        tenor: existing.tenor_days,
        instrument: existing.instrument_type,
        conditions: existing.conditions.join("\n"),
        notes: existing.notes ?? "",
      };
    }
    if (appetite === "CONSERVATIVE") {
      return { amount: Math.min(1_500_000, cap), rate: 10.5, tenor: 90, instrument: "INVENTORY_FINANCE", conditions: "Independent warehouse verification\nNo unresolved high-severity conflicts", notes: "" };
    }
    if (appetite === "AGGRESSIVE") {
      return { amount: Math.min(1_500_000, cap), rate: 15, tenor: 150, instrument: "PRODUCTION_FINANCE", conditions: "Enhanced monitoring enabled", notes: "" };
    }
    return { amount: Math.min(1_500_000, cap), rate: 12, tenor: 120, instrument: "PRODUCTION_FINANCE", conditions: "Production progress must remain above 70%", notes: "" };
  }, [existing, marketplace.lender_profile?.risk_appetite, maxSafe, marketplace.remaining_available_capacity]);

  const [amount, setAmount] = useState(defaults.amount);
  const [rate, setRate] = useState(defaults.rate);
  const [tenor, setTenor] = useState(defaults.tenor);
  const [instrument, setInstrument] = useState(defaults.instrument);
  const [conditions, setConditions] = useState(defaults.conditions);
  const [notes, setNotes] = useState(defaults.notes);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = marketplace.can_submit_offer ?? (marketplace.eligible !== false && marketplace.eligibility_status !== "NOT_ELIGIBLE");
  const financed = request.decision_status === "FINANCED" || (request.decision_status === "PARTIALLY_FINANCED" && (marketplace.remaining_available_capacity ?? 0) <= 0);

  async function handleSubmit() {
    setError(null);
    if (!canSubmit) {
      setError(marketplace.eligibility_reason ?? "You are not eligible to submit an offer.");
      return;
    }
    if (amount <= 0 || amount > maxSafe) {
      setError(`Offered amount must be between ₹1 and ${formatINRCompact(maxSafe)} (remaining verified capacity).`);
      return;
    }
    try {
      await onSubmit({
        offered_amount: amount,
        interest_rate: rate,
        tenor_days: tenor,
        instrument_type: instrument,
        conditions: conditions.split("\n").map((c) => c.trim()).filter(Boolean),
        notes: notes || undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit offer");
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.375rem] border border-lime/30 bg-ink p-6 text-white shadow-lg md:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-lime">Competitive offer</p>
          <h2 className="mt-1 font-display text-xl font-semibold md:text-2xl">Make an offer</h2>
          <p className="mt-1 text-sm text-white/55">
            {marketplace.lender_profile?.lender_name ?? "Lender"} · {marketplace.lender_profile?.risk_appetite ?? "—"} appetite
          </p>
        </div>
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wide",
            canSubmit ? "border-lime/40 bg-lime/10 text-lime" : "border-white/15 bg-white/5 text-white/70",
          )}
        >
          {marketplace.eligibility_status.replace(/_/g, " ")}
        </span>
      </div>

      {!canSubmit ? (
        <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
          {marketplace.eligibility_reason}
        </p>
      ) : marketplace.eligibility_status === "CONDITIONAL" ? (
        <p className="mt-5 rounded-xl border border-lime/20 bg-lime/5 p-4 text-sm text-lime/90">
          {marketplace.eligibility_reason}
        </p>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Requested" value={formatINRCompact(request.required_funding_amount)} />
        <Metric label="Available capacity" value={formatINRCompact(marketplace.remaining_available_capacity ?? maxSafe)} accent="lime" />
        <Metric label="Confidence" value={`${request.confidence_score}%`} />
        <Metric label="Utilization" value={`${marketplace.utilization_percentage ?? 0}%`} />
        <Metric label="Active exposure" value={formatINRCompact(marketplace.active_exposure ?? request.outstanding_exposure)} />
        <Metric label="Suggested max offer" value={formatINRCompact(maxSafe)} accent="lime" />
      </div>

      {marketplace.competition_label ? (
        <p className="mt-4 text-sm text-lime/90">🔥 {marketplace.competition_label}</p>
      ) : null}

      {!financed && canSubmit ? (
        <div className="mt-6 space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Offered amount (INR)" value={amount} onChange={setAmount} type="number" />
            <Field label="Interest rate (%)" value={rate} onChange={setRate} type="number" step="0.1" />
            <Field label="Tenor (days)" value={tenor} onChange={setTenor} type="number" />
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Instrument</label>
              <select
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
              >
                {INSTRUMENTS.map((i) => (
                  <option key={i} value={i} className="text-ink">
                    {i.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Conditions (one per line)</label>
            <textarea
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              rows={3}
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Optional notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            />
          </div>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <div className="flex justify-center pt-2">
            <Button variant="lime" size="lg" disabled={loading} className="min-w-[200px] font-semibold" onClick={handleSubmit}>
              {existing?.status === "PENDING" ? "Update offer" : "Submit offer"}
            </Button>
          </div>
        </div>
      ) : financed ? (
        <p className="mt-5 text-sm text-white/60">This request has been financed. Offer submission is closed.</p>
      ) : null}

      {existing && existing.status === "PENDING" ? (
        <p className="mt-4 text-center text-xs text-white/50">
          Your pending offer: {formatINRCompact(existing.offered_amount)} @ {existing.interest_rate}% · {existing.tenor_days} days
        </p>
      ) : null}
      {existing && existing.status === "LOST" ? (
        <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
          Another financing offer was selected by the manufacturer.
        </p>
      ) : null}
      {existing && existing.status === "WON" ? (
        <p className="mt-4 rounded-lg border border-lime/30 bg-lime/10 p-4 text-sm font-medium text-lime">
          Your offer was accepted — financing is active.
        </p>
      ) : null}
    </motion.section>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">{label}</p>
      <p className={cn("mt-1 font-display text-lg font-semibold", accent === "lime" ? "text-lime" : "text-white")}>{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  step,
}: {
  label: string;
  value: number | string;
  onChange: (v: number) => void;
  type?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-wide text-white/45">{label}</label>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
      />
    </div>
  );
}
