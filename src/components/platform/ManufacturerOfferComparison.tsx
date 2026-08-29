"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { ManufacturerContent, ManufacturerSection } from "@/components/platform/ManufacturerContent";
import { Button } from "@/components/ui/button";
import { formatINRCompact } from "@/lib/format";
import { acceptManufacturerOffer, fetchManufacturerOffers } from "@/lib/platform/hooks";
import type { FinancingOffer, ManufacturerOffersResponse } from "@/types/platform";
import { cn } from "@/lib/utils";

type SortKey = "recommended" | "rate" | "amount" | "cost" | "tenor" | "conditions";

interface ManufacturerOfferComparisonProps {
  requestId: string;
  token: string;
}

export function ManufacturerOfferComparison({ requestId, token }: ManufacturerOfferComparisonProps) {
  const [data, setData] = useState<ManufacturerOffersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>("recommended");
  const [accepting, setAccepting] = useState<string | null>(null);
  const [confirmOffer, setConfirmOffer] = useState<FinancingOffer | null>(null);
  const [success, setSuccess] = useState<FinancingOffer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchManufacturerOffers(token, requestId)
      .then(setData)
      .catch(() => setError("Failed to load offers"))
      .finally(() => setLoading(false));
  }, [token, requestId]);

  useEffect(load, [load]);

  const pendingOffers = useMemo(() => {
    const offers = (data?.offers ?? []).filter((o) => o.status === "PENDING" || o.status === "WON");
    if (sort === "recommended") return [...offers].sort((a, b) => (a.comparison_rank ?? 99) - (b.comparison_rank ?? 99));
    if (sort === "rate") return [...offers].sort((a, b) => a.interest_rate - b.interest_rate);
    if (sort === "amount") return [...offers].sort((a, b) => b.offered_amount - a.offered_amount);
    if (sort === "cost") return [...offers].sort((a, b) => (a.effective_cost_pct ?? 999) - (b.effective_cost_pct ?? 999));
    if (sort === "tenor") return [...offers].sort((a, b) => b.tenor_days - a.tenor_days);
    if (sort === "conditions") return [...offers].sort((a, b) => (a.conditions?.length ?? 0) - (b.conditions?.length ?? 0));
    return offers;
  }, [data?.offers, sort]);

  const lowestCost = useMemo(() => {
    const pending = (data?.offers ?? []).filter((o) => o.status === "PENDING");
    if (!pending.length) return null;
    return pending.reduce((best, o) => ((o.effective_cost_pct ?? 999) < (best.effective_cost_pct ?? 999) ? o : best));
  }, [data?.offers]);

  async function handleAccept() {
    if (!confirmOffer) return;
    setAccepting(confirmOffer.id);
    setError(null);
    try {
      const result = await acceptManufacturerOffer(token, requestId, confirmOffer.id);
      setSuccess(result.offer);
      setConfirmOffer(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to accept offer");
    } finally {
      setAccepting(null);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading competitive offers…</p>;
  }

  if (success || data?.status === "ACTIVE_FINANCING") {
    const won = success ?? pendingOffers.find((o) => o.status === "WON");
    return (
      <ManufacturerContent className="space-y-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[1.5rem] border border-lime/30 bg-ink p-10 text-center text-white"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lime">Financing secured</p>
          <p className="mt-4 font-display text-5xl font-semibold">{won ? formatINRCompact(won.offered_amount) : "—"}</p>
          <p className="mt-2 text-lg text-white/70">from</p>
          <p className="font-display text-2xl font-semibold text-lime">{won?.lender_name}</p>
          {won ? (
            <div className="mx-auto mt-8 max-w-md space-y-2 text-left text-sm text-white/65">
              <p>Interest: {won.interest_rate}% · Tenor: {won.tenor_days} days</p>
              <p>Instrument: {won.instrument_type.replace(/_/g, " ")}</p>
              {won.conditions?.length ? (
                <ul className="mt-3 list-inside list-disc space-y-1">
                  {won.conditions.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          <Link href={`/manufacturer/production-plans/${requestId}`} className="mt-8 inline-block text-sm font-semibold text-lime hover:underline">
            View production request →
          </Link>
        </motion.div>
      </ManufacturerContent>
    );
  }

  const offerCount = data?.offer_count ?? 0;

  return (
    <ManufacturerContent className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Capital marketplace</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Compare financing offers</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {offerCount} competing offer{offerCount !== 1 ? "s" : ""} for {data?.request_code}. Choose the structure that best fits your production plan.
          </p>
        </div>
        <Link
          href="/manufacturer/ai-assistant"
          className="inline-flex items-center gap-2 rounded-full border border-foreground/10 px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:border-lime hover:text-ink"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Ask AI to compare
        </Link>
      </header>

      {offerCount > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Offers received" value={String(offerCount)} />
          <SummaryCard label="Best rate" value={data?.best_rate != null ? `${data.best_rate}%` : "—"} />
          <SummaryCard label="Highest funding" value={data?.highest_amount != null ? formatINRCompact(data.highest_amount) : "—"} highlight />
          <SummaryCard label="Lowest cost" value={lowestCost ? `${lowestCost.effective_cost_pct?.toFixed(2)}% eff.` : "—"} />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["recommended", "Recommended overall"],
            ["rate", "Lowest rate"],
            ["amount", "Highest amount"],
            ["cost", "Lowest cost"],
            ["tenor", "Longest tenor"],
            ["conditions", "Fewest conditions"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSort(key)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-xs font-semibold transition",
              sort === key ? "border-lime bg-lime/20 text-ink" : "border-foreground/10 text-muted-foreground hover:border-foreground/20",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {offerCount === 0 ? (
        <div className="rounded-[1.25rem] border border-dashed border-foreground/15 bg-white p-12 text-center">
          <p className="font-display text-xl font-semibold">No offers received yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Your request is visible to eligible lenders. You will be notified when offers arrive.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-[1.25rem] border border-foreground/10 bg-white lg:block">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-foreground/8 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-4">Rank</th>
                  <th className="px-5 py-4">Lender</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Rate</th>
                  <th className="px-5 py-4">Tenor</th>
                  <th className="px-5 py-4">Eff. cost</th>
                  <th className="px-5 py-4">Conditions</th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>
              <tbody>
                {pendingOffers.map((offer) => (
                  <OfferRow key={offer.id} offer={offer} recommended={offer.id === data?.recommended_offer_id} onAccept={() => setConfirmOffer(offer)} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 lg:hidden">
            {pendingOffers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} recommended={offer.id === data?.recommended_offer_id} onAccept={() => setConfirmOffer(offer)} />
            ))}
          </div>
        </>
      )}

      <AnimatePresence>
        {confirmOffer ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
            onClick={() => setConfirmOffer(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-md rounded-[1.25rem] border border-foreground/10 bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-xl font-semibold">Confirm acceptance</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                You are accepting the offer from <strong className="text-ink">{confirmOffer.lender_name}</strong>.
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Amount</dt><dd className="font-semibold">{formatINRCompact(confirmOffer.offered_amount)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Interest</dt><dd className="font-semibold">{confirmOffer.interest_rate}%</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Tenor</dt><dd className="font-semibold">{confirmOffer.tenor_days} days</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Instrument</dt><dd className="font-semibold">{confirmOffer.instrument_type.replace(/_/g, " ")}</dd></div>
              </dl>
              {confirmOffer.conditions?.length ? (
                <ul className="mt-3 list-inside list-disc text-sm text-muted-foreground">
                  {confirmOffer.conditions.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-4 text-xs text-muted-foreground">Once accepted, competing pending offers will automatically be closed.</p>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setConfirmOffer(null)}>Cancel</Button>
                <Button variant="lime" className="flex-1 font-semibold" disabled={!!accepting} onClick={handleAccept}>
                  Confirm & accept
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </ManufacturerContent>
  );
}

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-[1.25rem] border p-5", highlight ? "border-lime/30 bg-lime/10" : "border-foreground/10 bg-white")}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}

function OfferRow({ offer, recommended, onAccept }: { offer: FinancingOffer; recommended?: boolean; onAccept: () => void }) {
  return (
    <tr className={cn("border-b border-foreground/6", recommended && "bg-lime/5")}>
      <td className="px-5 py-4 font-semibold">#{offer.comparison_rank ?? "—"}</td>
      <td className="px-5 py-4">
        <p className="font-semibold">{offer.lender_name}</p>
        {recommended ? <span className="text-[10px] font-semibold uppercase text-lime-deep">Recommended</span> : null}
      </td>
      <td className="px-5 py-4">{formatINRCompact(offer.offered_amount)}</td>
      <td className="px-5 py-4">{offer.interest_rate}%</td>
      <td className="px-5 py-4">{offer.tenor_days}d</td>
      <td className="px-5 py-4">{offer.effective_cost_pct?.toFixed(2)}%</td>
      <td className="max-w-[200px] px-5 py-4 text-xs text-muted-foreground">{offer.conditions?.join(" · ") || "—"}</td>
      <td className="px-5 py-4">
        <Button variant="lime" size="sm" className="font-semibold" onClick={onAccept}>Accept</Button>
      </td>
    </tr>
  );
}

function OfferCard({ offer, recommended, onAccept }: { offer: FinancingOffer; recommended?: boolean; onAccept: () => void }) {
  return (
    <article className={cn("rounded-[1.25rem] border p-6", recommended ? "border-lime/30 bg-lime/5" : "border-foreground/10 bg-white")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Rank #{offer.comparison_rank}</p>
          <h3 className="font-display text-xl font-semibold">{offer.lender_name}</h3>
        </div>
        {recommended ? <span className="rounded-full bg-lime/25 px-3 py-1 text-[10px] font-semibold uppercase">Recommended</span> : null}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div><p className="text-muted-foreground">Amount</p><p className="font-semibold">{formatINRCompact(offer.offered_amount)}</p></div>
        <div><p className="text-muted-foreground">Rate</p><p className="font-semibold">{offer.interest_rate}%</p></div>
        <div><p className="text-muted-foreground">Tenor</p><p className="font-semibold">{offer.tenor_days} days</p></div>
        <div><p className="text-muted-foreground">Eff. cost</p><p className="font-semibold">{offer.effective_cost_pct?.toFixed(2)}%</p></div>
      </div>
      {offer.comparison_rank_reason ? <p className="mt-3 text-xs text-muted-foreground">{offer.comparison_rank_reason}</p> : null}
      <Button variant="lime" className="mt-5 w-full font-semibold" onClick={onAccept}>Accept offer</Button>
    </article>
  );
}
