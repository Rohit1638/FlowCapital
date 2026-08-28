import type { Asset } from "@/types/asset";
import type {
  ConflictRecord,
  EventSource,
  IntegrationEvent,
  ProcessEventResult,
  ProcessingStep,
  RawEventPayload,
} from "@/types/integration";
import { buildTwinPatch } from "@/lib/integration/apply";
import { scoreConfidence } from "@/lib/integration/confidence";
import { matchAsset } from "@/lib/integration/match";
import { normalizeRawEvent } from "@/lib/integration/normalize";
import { reconcileEvent } from "@/lib/integration/reconcile";
import { eventFingerprint, validateEvent } from "@/lib/integration/validate";

function step(key: ProcessingStep["key"], status: ProcessingStep["status"], detail: string): ProcessingStep {
  return { key, label: key.replaceAll("_", " "), status, detail };
}

function explain(event: IntegrationEvent, details: string): string {
  return `${event.sourceSystem} sent ${event.eventType}. ${details}`;
}

export function processIncomingEvent(
  source: EventSource,
  raw: RawEventPayload,
  assets: Asset[],
  existing: IntegrationEvent[],
  options?: { id?: string },
): ProcessEventResult {
  const normalized = normalizeRawEvent(source, raw);
  if (options?.id) normalized.id = options.id;

  const steps: ProcessingStep[] = [
    step("RECEIVED", "passed", "Ingested by the FlowCapital event engine (simulated connector)."),
    step("NORMALIZED", "passed", "Source payload converted into the canonical IntegrationEvent model."),
  ];

  const match = matchAsset(normalized, assets);
  normalized.assetId = match.assetId;
  if (match.kind !== "MATCHED") {
    steps.push(step("ASSET_MATCHED", "failed", match.reason));
    steps.push(step("REJECTED", "stopped", "Event was not applied."));
    normalized.status = "REJECTED";
    normalized.processingSteps = steps;
    normalized.errorMessage = match.reason;
    normalized.explanation = explain(normalized, match.reason);
    return { event: normalized };
  }

  steps.push(step("ASSET_MATCHED", "passed", match.reason));
  const asset = assets.find((item) => item.id === match.assetId);

  const validation = validateEvent(normalized, asset, existing);
  if (!validation.valid) {
    const duplicate = validation.errors.includes("DUPLICATE EVENT PREVENTED");
    steps.push(step("VALIDATED", "failed", validation.errors.join(" ")));
    if (duplicate) {
      steps.push(step("DUPLICATE", "stopped", "The same external signal was already processed."));
      normalized.status = "DUPLICATE";
    } else {
      steps.push(step("REJECTED", "stopped", validation.errors[0] ?? "Validation failed."));
      normalized.status = "REJECTED";
    }
    normalized.processingSteps = steps;
    normalized.errorMessage = validation.errors.join(" ");
    normalized.explanation = explain(normalized, validation.errors.join(" "));
    const scored = scoreConfidence(normalized, asset, []);
    normalized.confidence = scored.score;
    normalized.confidenceLevel = scored.level;
    return { event: normalized };
  }

  steps.push(step("VALIDATED", "passed", "Required fields, source, type, and lifecycle order are valid."));

  if (!asset) {
    normalized.status = "FAILED";
    return { event: normalized };
  }

  const findings = reconcileEvent(normalized, asset);
  const conflictFinding = findings.find((item) => item.status === "CONFLICT");
  const scored = scoreConfidence(normalized, asset, findings);
  normalized.confidence = scored.score;
  normalized.confidenceLevel = scored.level;

  if (conflictFinding) {
    steps.push(step("RECONCILED", "failed", conflictFinding.message));
    steps.push(step("CONFLICT_DETECTED", "stopped", "Unsafe automatic overwrite was blocked."));
    normalized.status = "CONFLICT_DETECTED";
    normalized.conflictDetected = true;
    normalized.processingSteps = steps;
    normalized.explanation = explain(normalized, conflictFinding.message);
    const conflictType =
      conflictFinding.field === "quantity"
        ? "QUANTITY_MISMATCH"
        : conflictFinding.field === "location"
          ? "LOCATION_MISMATCH"
          : conflictFinding.field === "invoiceValue"
            ? "VALUE_MISMATCH"
            : conflictFinding.field === "currentStage"
              ? "LIFECYCLE_MISMATCH"
              : "QUANTITY_MISMATCH";
    const conflict: ConflictRecord = {
      id: `cnf-${normalized.id}`,
      assetId: asset.id,
      eventId: normalized.id,
      type: conflictType,
      severity: "HIGH",
      title: conflictType.replaceAll("_", " "),
      description: conflictFinding.message,
      expectedValue: conflictFinding.expected ?? "—",
      actualValue: conflictFinding.actual ?? "—",
      difference: conflictFinding.difference ?? "—",
      status: "OPEN",
      detectedAt: normalized.receivedAt,
      sourceSystems: [normalized.source, "PRODUCTION"],
    };
    return { event: normalized, conflict };
  }

  const invalid = findings.find((item) => item.status === "INVALID_EVENT_ORDER");
  if (invalid) {
    steps.push(step("RECONCILED", "failed", invalid.message));
    steps.push(step("REJECTED", "stopped", invalid.message));
    normalized.status = "REJECTED";
    normalized.processingSteps = steps;
    normalized.errorMessage = invalid.message;
    normalized.explanation = explain(normalized, invalid.message);
    return { event: normalized };
  }

  steps.push(step("RECONCILED", "passed", findings[0]?.message ?? "Consistent with the twin."));
  const patch = buildTwinPatch(normalized, asset);
  steps.push(step("APPLIED", "passed", "Digital Asset Twin updated from this event."));
  normalized.status = "APPLIED";
  normalized.processingSteps = steps;
  normalized.explanation = explain(
    normalized,
    `${match.reason} It passed lifecycle validation and was consistent with the current asset state. The Digital Asset Twin was updated successfully.`,
  );
  return { event: normalized, patch };
}

export { eventFingerprint };
