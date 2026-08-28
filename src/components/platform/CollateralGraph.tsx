"use client";

import type { CollateralItem, ProductionRequest } from "@/types/platform";
import { formatINRCompact } from "@/lib/format";

export function CollateralGraph({ request }: { request: ProductionRequest }) {
  const collateral = request.collateral ?? [];

  return (
    <div className="rounded-[1.4rem] border border-foreground/10 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Collateral relationship map</p>
      <div className="mt-6 flex flex-col items-center gap-4">
        <Node label={request.manufacturer_name ?? "Manufacturer"} sub="Entity" tone="dark" />
        <Connector />
        <Node label={request.project_name} sub={request.request_code} tone="lime" />
        <Connector />
        <div className="grid w-full gap-3 md:grid-cols-2">
          {collateral.map((item) => (
            <CollateralNode key={item.id} item={item} />
          ))}
        </div>
        <Connector />
        <div className="grid w-full gap-3 md:grid-cols-3">
          <Node label={formatINRCompact(request.financeable_value)} sub="Financeable value" tone="light" />
          <Node label={formatINRCompact(request.outstanding_exposure)} sub="Existing exposure" tone="light" />
          <Node label={formatINRCompact(request.unclaimed_value)} sub="Unclaimed value" tone="lime" />
        </div>
        {(request.tranches ?? []).length > 0 ? (
          <>
            <Connector />
            <Node label={request.tranches![0].instrument.replace(/_/g, " ")} sub={`${formatINRCompact(request.tranches![0].approved_amount)} · ${request.decisions?.[0]?.lender_name ?? "Lender"}`} tone="dark" />
          </>
        ) : null}
      </div>
    </div>
  );
}

function Node({ label, sub, tone }: { label: string; sub: string; tone: "dark" | "lime" | "light" }) {
  const styles =
    tone === "dark"
      ? "bg-ink text-white"
      : tone === "lime"
        ? "bg-lime text-ink"
        : "border border-foreground/10 bg-surface-2 text-ink";
  return (
    <div className={`w-full max-w-md rounded-2xl px-5 py-4 text-center ${styles}`}>
      <p className="font-display text-lg font-semibold">{label}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.14em] opacity-70">{sub}</p>
    </div>
  );
}

function CollateralNode({ item }: { item: CollateralItem }) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{item.asset_type.replace(/_/g, " ")}</p>
      <p className="mt-1 font-semibold">{item.asset_name}</p>
      <p className="mt-2 text-sm text-muted-foreground">{item.quantity} {item.unit} · {item.lifecycle_stage.replace(/_/g, " ")}</p>
      <p className="mt-2 font-display text-xl font-semibold">{formatINRCompact(item.estimated_value)}</p>
      {item.already_pledged ? <p className="mt-2 text-xs font-semibold text-destructive">Already pledged elsewhere</p> : null}
    </div>
  );
}

function Connector() {
  return <div className="h-6 w-px bg-foreground/20" />;
}
