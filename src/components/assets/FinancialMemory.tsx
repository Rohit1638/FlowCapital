"use client";

import type { FinancingRecord } from "@/types/financing";
import { formatCurrencyINR, formatDate } from "@/lib/format";

const instrumentLabel: Record<FinancingRecord["instrument"], string> = {
  PO_FINANCING: "Purchase Order Financing",
  PROCUREMENT_FINANCING: "Procurement Financing",
  INVENTORY_FINANCING: "Inventory Financing",
  PRODUCTION_FINANCING: "Production Financing",
  IN_TRANSIT_FINANCING: "In-Transit Financing",
  WAREHOUSE_RECEIPT: "Warehouse Receipt",
  INVOICE_DISCOUNTING: "Invoice Discounting",
  RECEIVABLE_FINANCING: "Receivable Financing",
};

export function FinancialMemory({ records }: { records: FinancingRecord[] }) {
  const ordered = [...records].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  return (
    <section className="rounded-[1.6rem] bg-ink p-5 text-white md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Financial memory</p>
      <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
        A complete record of capital associated with this asset.
      </h2>
      <div className="mt-6 space-y-3">
        {ordered.map((record) => (
          <div key={record.id} className="rounded-2xl border border-white/10 px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg font-semibold">{instrumentLabel[record.instrument]}</p>
                <p className="mt-1 text-sm text-white/50">{record.reason}</p>
              </div>
              <p className="font-display text-2xl text-lime">{formatCurrencyINR(record.amount, 2)}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/45">
              <span>{record.lender}</span>
              <span>{record.status}</span>
              <span>From {formatDate(record.startDate)}</span>
              {record.endDate ? <span>To {formatDate(record.endDate)}</span> : null}
            </div>
          </div>
        ))}
        {ordered.length === 0 ? (
          <p className="text-sm text-white/50">No facilities drawn against this twin yet.</p>
        ) : null}
      </div>
      <div className="mt-6 rounded-2xl bg-white/5 px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-lime">Next intelligence evaluation</p>
        <p className="mt-2 text-sm leading-6 text-white/70">
          PO Financing → Production Financing → Finished-goods. Open Financial Intelligence to see recommended
          financing capacity as verified evidence improves.
        </p>
      </div>
    </section>
  );
}
