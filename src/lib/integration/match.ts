import type { Asset } from "@/types/asset";
import type { IntegrationEvent, MatchResult } from "@/types/integration";

function payloadString(event: IntegrationEvent, key: string): string | undefined {
  const value = event.payload[key] ?? event.rawPayload[key];
  return typeof value === "string" ? value : undefined;
}

export function matchAsset(event: IntegrationEvent, assets: Asset[]): MatchResult {
  if (event.assetId) {
    const direct = assets.find((asset) => asset.id === event.assetId);
    if (direct) {
      return { kind: "MATCHED", assetId: direct.id, reason: `Matched on Asset ID ${direct.id}.` };
    }
  }

  const candidates = new Set<string>();
  const po = payloadString(event, "purchaseOrder") ?? payloadString(event, "po_no");
  const invoice = payloadString(event, "invoiceNumber") ?? payloadString(event, "invoice_no");
  const batch = payloadString(event, "batchId") ?? payloadString(event, "assetRef");
  const shipment = payloadString(event, "shipmentId");

  for (const asset of assets) {
    if (po && asset.contractual.purchaseOrderNumber === po) candidates.add(asset.id);
    if (invoice && asset.contractual.invoiceNumber === invoice) candidates.add(asset.id);
    if (batch && (asset.id === batch || asset.name.includes(batch))) candidates.add(asset.id);
    if (shipment && asset.id === shipment) candidates.add(asset.id);
  }

  const ids = Array.from(candidates);
  if (ids.length === 1) {
    return { kind: "MATCHED", assetId: ids[0], reason: "Matched on fallback identifier (PO, invoice, batch, or shipment)." };
  }
  if (ids.length > 1) {
    return { kind: "AMBIGUOUS", assetId: null, reason: `Ambiguous match across ${ids.join(", ")}. Event was not applied.` };
  }
  return { kind: "NOT_FOUND", assetId: null, reason: "No Digital Asset Twin matched this event." };
}
