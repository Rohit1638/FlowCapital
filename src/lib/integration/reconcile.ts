import type { Asset } from "@/types/asset";
import { canTransition, getStageIndex } from "@/lib/lifecycle";
import type { IntegrationEvent, ReconciliationFinding } from "@/types/integration";

function num(event: IntegrationEvent, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = event.payload[key];
    if (typeof value === "number") return value;
  }
  return undefined;
}

export function reconcileEvent(event: IntegrationEvent, asset: Asset): ReconciliationFinding[] {
  const findings: ReconciliationFinding[] = [];

  if (event.eventType === "PRODUCTION_PROGRESS_UPDATED" || event.eventType === "PRODUCTION_COMPLETED") {
    const incoming = num(event, ["completionPercentage", "productionPct"]) ?? (event.eventType === "PRODUCTION_COMPLETED" ? 100 : undefined);
    if (incoming !== undefined) {
      if (incoming < asset.physical.productionCompletion) {
        findings.push({
          field: "productionCompletion",
          status: "CONFLICT",
          expected: `${asset.physical.productionCompletion}%`,
          actual: `${incoming}%`,
          difference: `${asset.physical.productionCompletion - incoming} pts`,
          message: "Incoming production is behind the twin and was not auto-applied.",
        });
      } else if (incoming === asset.physical.productionCompletion) {
        findings.push({
          field: "productionCompletion",
          status: "NO_CHANGE",
          message: "Production percentage already matches the twin.",
        });
      } else {
        findings.push({
          field: "productionCompletion",
          status: "VALID_UPDATE",
          expected: `${asset.physical.productionCompletion}%`,
          actual: `${incoming}%`,
          message: `Production can advance from ${asset.physical.productionCompletion}% to ${incoming}%.`,
        });
      }
    }
  }

  if (event.eventType === "FINISHED_GOODS_CONFIRMED") {
    if (getStageIndex(asset.currentStage) >= getStageIndex("FINISHED_GOODS")) {
      findings.push({
        field: "currentStage",
        status: "NO_CHANGE",
        message: "Twin is already at or beyond finished goods.",
      });
    } else {
      const allowed = canTransition(asset.currentStage, "FINISHED_GOODS");
      findings.push({
        field: "currentStage",
        status: allowed ? "VALID_UPDATE" : "INVALID_EVENT_ORDER",
        expected: "FINISHED_GOODS",
        actual: asset.currentStage,
        message: allowed
          ? "Lifecycle may advance IN_PRODUCTION → FINISHED_GOODS."
          : "FINISHED_GOODS_CONFIRMED is not a valid transition from the current stage.",
      });
    }
  }

  if (event.eventType === "PAYMENT_RECEIVED") {
    const payable = asset.currentStage === "INVOICE" || asset.currentStage === "RECEIVABLE" || asset.currentStage === "CASH_REALISED";
    if (!payable) {
      findings.push({
        field: "lifecycle",
        status: "INVALID_EVENT_ORDER",
        expected: "INVOICE or RECEIVABLE",
        actual: asset.currentStage,
        message: "Payment cannot be received before the asset progresses through delivery, invoicing, and receivable stages.",
      });
    }
  }

  if (
    event.eventType === "QUANTITY_MISMATCH_DETECTED" ||
    event.eventType === "QUANTITY_VERIFIED" ||
    event.eventType === "WAREHOUSE_RECEIVED"
  ) {
    const expected = num(event, ["expectedQty"]);
    const actual = num(event, ["actualQty"]);
    if (expected !== undefined && actual !== undefined && expected !== actual) {
      findings.push({
        field: "quantity",
        status: "CONFLICT",
        expected: `${expected} units`,
        actual: `${actual} units`,
        difference: `${Math.abs(expected - actual)} units`,
        message: "Quantity reconciliation failed. Unsafe automatic overwrite was blocked.",
      });
    } else if (actual !== undefined && actual === asset.quantity) {
      findings.push({
        field: "quantity",
        status: "NO_CHANGE",
        message: "Warehouse quantity matches the twin.",
      });
    } else if (actual !== undefined) {
      findings.push({
        field: "quantity",
        status: "VALID_UPDATE",
        actual: `${actual} units`,
        message: "Warehouse quantity is consistent enough to record.",
      });
    }
  }

  const location = event.payload.location ?? event.payload.locationCode;
  if (typeof location === "string" && event.source === "LOGISTICS") {
    findings.push({
      field: "location",
      status: location === asset.location ? "NO_CHANGE" : "VALID_UPDATE",
      actual: location,
      message: "Shipment location can be recorded on the twin.",
    });
  }

  const invoiceValue = num(event, ["amount"]);
  if (event.eventType === "INVOICE_GENERATED" && invoiceValue !== undefined && asset.contractual.invoiceValue) {
    if (invoiceValue !== asset.contractual.invoiceValue) {
      findings.push({
        field: "invoiceValue",
        status: "CONFLICT",
        expected: String(asset.contractual.invoiceValue),
        actual: String(invoiceValue),
        difference: String(Math.abs(asset.contractual.invoiceValue - invoiceValue)),
        message: "Invoice value does not match the contractual twin.",
      });
    }
  }

  if (findings.length === 0) {
    findings.push({
      field: "state",
      status: "VALID_UPDATE",
      message: "Event is consistent with the current Digital Asset Twin.",
    });
  }

  return findings;
}
