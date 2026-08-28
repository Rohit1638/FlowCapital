"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DocumentUploader, uploadPendingDocuments, type PendingDocument } from "@/components/platform/DocumentUploader";
import { formatINRCompact } from "@/lib/format";
import { platformFetchAuth } from "@/lib/platform/client";

const STEPS = ["Production", "Funding", "Collateral", "Documents", "Review"] as const;

const inputClass =
  "mt-2 w-full rounded-xl border border-foreground/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-lime focus:ring-2 focus:ring-lime/20";

interface FinancingForm {
  project_name: string;
  product_name: string;
  product_category: string;
  quantity: number;
  expected_completion_date: string;
  required_funding_amount: number;
  funding_purpose: string;
  description: string;
  collateral_description: string;
}

const defaultForm: FinancingForm = {
  project_name: "Electric Bike Series X — Batch 1000",
  product_name: "VoltRide City E-Bike",
  product_category: "Electric Mobility",
  quantity: 1000,
  expected_completion_date: "2026-10-15",
  required_funding_amount: 5_000_000,
  funding_purpose: "Raw material procurement and production working capital",
  description: "Manufacture 1,000 electric bikes with lifecycle-backed financing.",
  collateral_description: "Battery packs, WIP inventory, finished goods",
};

export function FinancingRequestWizard({ token }: { token: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FinancingForm>(defaultForm);
  const [documents, setDocuments] = useState<PendingDocument[]>([]);

  const financeableCapacity = 2_800_000;
  const confidence = 64;
  const collateralValue = 6_280_000;
  const overCapacity = form.required_funding_amount > financeableCapacity;

  function update<K extends keyof FinancingForm>(key: K, value: FinancingForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const created = await platformFetchAuth<{ id: string; request_code: string }>(token, "/production-requests", {
        method: "POST",
        body: JSON.stringify({
          project_name: form.project_name,
          product_name: form.product_name,
          product_category: form.product_category,
          quantity: form.quantity,
          expected_selling_value: 12_000_000,
          estimated_production_cost: 8_500_000,
          required_funding_amount: form.required_funding_amount,
          funding_purpose: form.funding_purpose,
          expected_completion_date: form.expected_completion_date,
          description: form.description,
          buyer_name: "UrbanMove Fleet Services",
          purchase_order_reference: "PO-UM-2026-EB1000",
        }),
      });
      if (documents.length > 0) {
        await uploadPendingDocuments(token, created.id, documents);
      }
      await platformFetchAuth(token, `/production-requests/${created.id}/submit`, { method: "POST" });
      router.push(`/manufacturer/production-plans/${created.id}`);
    } catch {
      setError("Unable to save your request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-8">
        <div className="flex flex-wrap gap-3">
          {STEPS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(i)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition",
                i === step ? "border-ink bg-ink text-white" : i < step ? "border-lime bg-lime/20 text-ink" : "border-foreground/10 text-muted-foreground",
              )}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              {label}
            </button>
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[1.25rem] border border-foreground/10 bg-white p-6 md:p-8"
        >
          {step === 0 ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Product Name" value={form.product_name} onChange={(v) => update("product_name", v)} />
              <Field label="Product Category" value={form.product_category} onChange={(v) => update("product_category", v)} />
              <Field label="Project Name" value={form.project_name} onChange={(v) => update("project_name", v)} className="sm:col-span-2" />
              <Field label="Quantity" type="number" value={String(form.quantity)} onChange={(v) => update("quantity", Number(v))} />
              <Field label="Expected Completion" value={form.expected_completion_date} onChange={(v) => update("expected_completion_date", v)} />
              <Field label="Description" value={form.description} onChange={(v) => update("description", v)} className="sm:col-span-2" multiline />
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Required Funding" value={String(form.required_funding_amount)} onChange={(v) => update("required_funding_amount", Number(v))} helper="Amount in INR" />
              <Field label="Funding Purpose" value={form.funding_purpose} onChange={(v) => update("funding_purpose", v)} />
            </div>
          ) : null}

          {step === 2 ? (
            <Field label="Collateral Description" value={form.collateral_description} onChange={(v) => update("collateral_description", v)} multiline helper="Describe raw materials, WIP, and finished goods pledged against this request." />
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <p className="text-sm font-semibold">Supporting Documents</p>
              <p className="text-sm text-muted-foreground">Upload purchase orders, production plans, GST certificates, and collateral proof.</p>
              <DocumentUploader value={documents} onChange={setDocuments} />
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4 text-sm">
              <p className="font-display text-lg font-semibold">Request Summary</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <SummaryItem label="Production" value={form.product_name} />
                <SummaryItem label="Quantity" value={form.quantity.toLocaleString()} />
                <SummaryItem label="Requested Funding" value={formatINRCompact(form.required_funding_amount)} />
                <SummaryItem label="Collateral" value={form.collateral_description.slice(0, 40) + "…"} />
                <SummaryItem label="Documents" value={`${documents.length} uploaded`} />
                <SummaryItem label="Confidence" value={`${confidence} (initial)`} />
              </div>
            </div>
          ) : null}

          {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

          <div className="mt-8 flex gap-3">
            {step > 0 ? <Button variant="outline" onClick={() => setStep((s) => s - 1)}>Back</Button> : null}
            {step < STEPS.length - 1 ? (
              <Button className="bg-lime text-ink hover:bg-lime/90" onClick={() => setStep((s) => s + 1)}>Continue</Button>
            ) : (
              <Button className="bg-lime text-ink hover:bg-lime/90" onClick={submit} disabled={loading}>
                {loading ? "Submitting…" : "Submit Financing Request"}
              </Button>
            )}
          </div>
        </motion.div>
      </div>

      <aside className="lg:sticky lg:top-8 lg:self-start">
        <div className="rounded-[1.25rem] border border-foreground/10 bg-ink p-6 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">Request Summary</p>
          <div className="mt-6 space-y-5">
            <SummaryRow label="Requested" value={formatINRCompact(form.required_funding_amount)} highlight />
            <SummaryRow label="Est. financeable capacity" value={formatINRCompact(financeableCapacity)} />
            <SummaryRow label="Current confidence" value={`${confidence}`} sub="Moderate" />
            <SummaryRow label="Collateral value" value={formatINRCompact(collateralValue)} />
            <SummaryRow label="Documents" value={`${documents.length} / 5`} />
            <SummaryRow label="Funding readiness" value="MODERATE" />
          </div>
          {overCapacity ? (
            <p className="mt-5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs leading-relaxed text-amber-100">
              Requested funding is above the current estimated financeable capacity.
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", helper, className, multiline }: { label: string; value: string; onChange: (v: string) => void; type?: string; helper?: string; className?: string; multiline?: boolean }) {
  return (
    <label className={cn("block text-sm", className)}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      {multiline ? <textarea className={cn(inputClass, "min-h-[100px] resize-y")} value={value} onChange={(e) => onChange(e.target.value)} /> : <input type={type} className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} />}
      {helper ? <span className="mt-1 block text-xs text-muted-foreground">{helper}</span> : null}
    </label>
  );
}

function SummaryRow({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.12em] text-white/50">{label}</p>
      <p className={cn("mt-1 font-display text-2xl font-semibold", highlight && "text-lime")}>{value}</p>
      {sub ? <p className="text-xs text-white/55">{sub}</p> : null}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-foreground/10 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
