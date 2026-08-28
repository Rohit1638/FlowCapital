"use client";

import type { ReactNode } from "react";
import type { Asset } from "@/types/asset";
import { formatCurrencyINR, formatDate, getLifecycleLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

function Panel({
  eyebrow,
  title,
  children,
  tone = "light",
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  tone?: "light" | "dark" | "lime";
}) {
  return (
    <section
      className={cn(
        "flex h-full min-h-[360px] flex-col justify-between rounded-[1.5rem] p-6",
        tone === "light" && "border border-foreground/10 bg-white",
        tone === "dark" && "bg-ink text-white",
        tone === "lime" && "bg-lime text-ink",
      )}
    >
      <p
        className={cn(
          "text-[11px] font-semibold uppercase tracking-[0.18em]",
          tone === "dark" ? "text-white/40" : "text-ink/45",
        )}
      >
        {eyebrow}
      </p>
      <h3 className="mt-1 font-display text-xl font-semibold tracking-tight">{title}</h3>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-current/10 py-2.5 last:border-b-0">
      <span className={cn("text-xs uppercase tracking-[0.12em]", muted ? "opacity-50" : "opacity-60")}>{label}</span>
      <span className="max-w-[60%] text-right text-sm font-medium">{value}</span>
    </div>
  );
}

export function TwinStatePanels({ asset }: { asset: Asset }) {
  const buffer = Math.max(asset.currentValue - asset.financedAmount - asset.availableFinancing, 0);
  const total = Math.max(asset.currentValue, 1);
  const financedPct = (asset.financedAmount / total) * 100;
  const availablePct = (asset.availableFinancing / total) * 100;
  const bufferPct = (buffer / total) * 100;

  return (
    <div className="grid items-stretch gap-4 xl:grid-cols-3">
      <Panel eyebrow="01" title="Physical state" tone="light">
        <Row label="Current stage" value={getLifecycleLabel(asset.physical.stage)} />
        <Row label="Location" value={asset.physical.location} />
        <Row label="Quantity" value={`${asset.physical.quantity.toLocaleString("en-IN")} ${asset.physical.unit}`} />
        <Row label="Production" value={`${asset.physical.productionCompletion}% complete`} />
        <Row label="Condition" value={asset.physical.condition} />
        <Row label="Verification" value={asset.physical.verificationStatus.replaceAll("_", " ")} />
        <Row label="Last verified" value={formatDate(asset.physical.lastVerifiedAt)} />
        {asset.physical.shipmentStatus ? <Row label="Shipment" value={asset.physical.shipmentStatus} /> : null}
      </Panel>

      <Panel eyebrow="02" title="Financial state" tone="dark">
        <Row label="Original PO value" value={formatCurrencyINR(asset.financial.originalValue, 2)} />
        <Row label="Current asset value" value={formatCurrencyINR(asset.financial.currentValue, 2)} />
        <Row label="Capital deployed" value={formatCurrencyINR(asset.financial.financedAmount, 2)} />
        <Row label="Outstanding exposure" value={formatCurrencyINR(asset.financial.outstandingExposure, 2)} />
        <Row label="Available financing" value={formatCurrencyINR(asset.financial.availableFinancing, 2)} />
        <Row label="Status" value={asset.financial.financingStatus.replaceAll("_", " ")} />
        <div className="mt-5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">Capital composition</p>
          <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-white/10">
            <div className="bg-lime" style={{ width: `${financedPct}%` }} />
            <div className="bg-white" style={{ width: `${availablePct}%` }} />
            <div className="bg-white/30" style={{ width: `${bufferPct}%` }} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/65">
            <p>Financed {formatCurrencyINR(asset.financedAmount)}</p>
            <p>Available {formatCurrencyINR(asset.availableFinancing)}</p>
            <p>Buffer {formatCurrencyINR(buffer)}</p>
            <p>Value {formatCurrencyINR(asset.currentValue)}</p>
          </div>
        </div>
      </Panel>

      <Panel eyebrow="03" title="Contractual state" tone="lime">
        <Row label="Purchase order" value={asset.contractual.purchaseOrderNumber} />
        <Row label="Buyer" value={asset.contractual.buyer} />
        <Row label="Supplier" value={asset.contractual.supplier} />
        <Row label="Payment terms" value={asset.contractual.paymentTerms} />
        <Row label="Expected delivery" value={formatDate(asset.contractual.deliveryDate)} />
        {asset.contractual.invoiceNumber ? <Row label="Invoice" value={asset.contractual.invoiceNumber} /> : null}
        {asset.contractual.invoiceValue ? (
          <Row label="Invoice value" value={formatCurrencyINR(asset.contractual.invoiceValue, 2)} />
        ) : null}
        {asset.contractual.expectedPaymentDate ? (
          <Row label="Expected payment" value={formatDate(asset.contractual.expectedPaymentDate)} />
        ) : null}
        <Row label="Contract" value={asset.contractual.contractStatus} />
        <Row label="Ownership" value={asset.contractual.ownershipStatus} />
      </Panel>
    </div>
  );
}
