import type { Asset } from "@/types/asset";
import { formatCurrencyINR, formatDate } from "@/lib/format";

export function StageContextBanner({ asset }: { asset: Asset }) {
  if (asset.id === "DA-2026-003") {
    return (
      <div className="rounded-[1.4rem] bg-ink p-5 text-white md:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lime">Data inconsistency</p>
        <h2 className="mt-2 font-display text-2xl font-semibold">Warehouse count does not match production close.</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
          Production reported 92 assemblies. Pune Central Warehouse scanned 86. Available financing is compressed
          and the facility is on pending review until the twin is reconciled.
        </p>
      </div>
    );
  }

  if (asset.id === "DA-2026-002") {
    return (
      <div className="rounded-[1.4rem] border border-foreground/10 bg-white p-5 md:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">In transit</p>
        <h2 className="mt-2 font-display text-2xl font-semibold">
          {asset.physical.origin} → {asset.physical.destination}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{asset.physical.shipmentStatus}</p>
      </div>
    );
  }

  if (asset.id === "DA-2026-004") {
    return (
      <div className="rounded-[1.4rem] bg-lime p-5 text-ink md:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/55">Purchase order</p>
        <h2 className="mt-2 font-display text-2xl font-semibold">{asset.contractual.purchaseOrderNumber}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6">
          Verified PO for {formatCurrencyINR(asset.originalValue, 2)}. {formatCurrencyINR(asset.availableFinancing, 2)}{" "}
          procurement financing headroom is identified — no facility drawn yet.
        </p>
      </div>
    );
  }

  if (asset.id === "DA-2026-007") {
    return (
      <div className="rounded-[1.4rem] bg-ink p-5 text-white md:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lime">Receivable</p>
        <h2 className="mt-2 font-display text-2xl font-semibold">
          {asset.contractual.invoiceNumber} · {formatCurrencyINR(asset.contractual.invoiceValue ?? 0, 2)}
        </h2>
        <p className="mt-2 text-sm text-white/65">
          {asset.contractual.paymentTerms}. Expected cash {asset.contractual.expectedPaymentDate ? formatDate(asset.contractual.expectedPaymentDate) : "—"}.
          Outstanding twin value {formatCurrencyINR(asset.currentValue, 2)}.
        </p>
      </div>
    );
  }

  if (asset.id === "DA-2026-008") {
    return (
      <div className="rounded-[1.4rem] bg-lime p-5 text-ink md:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Lifecycle complete</p>
        <h2 className="mt-2 font-display text-2xl font-semibold">Cash realised. Financing settled.</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6">
          Original value {formatCurrencyINR(asset.originalValue, 2)} moved through the full path to zero remaining
          exposure. This twin is the reference successful close.
        </p>
      </div>
    );
  }

  if (asset.id === "DA-2026-001") {
    return (
      <div className="rounded-[1.4rem] border border-foreground/10 bg-white p-5 md:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Primary demo twin</p>
        <h2 className="mt-2 font-display text-2xl font-semibold">Two-day raw-material delay is on the book.</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{asset.situation}</p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.4rem] border border-foreground/10 bg-white p-5 md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Current situation</p>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{asset.situation}</p>
    </div>
  );
}
