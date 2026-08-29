import { platformFetchAuth } from "@/lib/platform/client";
import {
  demoLenderDashboard,
  demoManufacturerDashboard,
  demoProductionRequest,
  DEMO_REQUEST_ID,
} from "@/lib/platform/demo-fallback";
import type { LenderDashboard, ManufacturerDashboard, ProductionRequest } from "@/types/platform";

export async function fetchManufacturerDashboard(token: string): Promise<ManufacturerDashboard> {
  try {
    return await platformFetchAuth<ManufacturerDashboard>(token, "/manufacturer/dashboard");
  } catch {
    return demoManufacturerDashboard;
  }
}

export async function fetchLenderDashboard(token: string): Promise<LenderDashboard> {
  try {
    return await platformFetchAuth<LenderDashboard>(token, "/lender/dashboard");
  } catch {
    return demoLenderDashboard;
  }
}

export async function fetchProductionRequest(token: string, id: string): Promise<ProductionRequest> {
  try {
    return await platformFetchAuth<ProductionRequest>(token, `/production-requests/${id}`);
  } catch {
    return id === DEMO_REQUEST_ID ? demoProductionRequest : demoProductionRequest;
  }
}

export async function fetchOpportunity(token: string, id: string): Promise<ProductionRequest> {
  try {
    return await platformFetchAuth<ProductionRequest>(token, `/lender/opportunities/${id}`);
  } catch {
    return demoProductionRequest;
  }
}

export async function fetchProductionRequests(token: string): Promise<ProductionRequest[]> {
  try {
    const res = await platformFetchAuth<{ items: ProductionRequest[] }>(token, "/manufacturer/production-requests");
    return res.items;
  } catch {
    return demoManufacturerDashboard.requests;
  }
}

export async function fetchOpportunities(token: string) {
  try {
    const res = await platformFetchAuth<{ items: LenderDashboard["opportunities"] }>(token, "/lender/opportunities");
    return res.items;
  } catch {
    return demoLenderDashboard.opportunities;
  }
}

export async function fetchManufacturerOffers(token: string, requestId: string) {
  return platformFetchAuth<import("@/types/platform").ManufacturerOffersResponse>(
    token,
    `/manufacturer/requests/${requestId}/offers`,
  );
}

export async function acceptManufacturerOffer(token: string, requestId: string, offerId: string) {
  return platformFetchAuth<{ offer: import("@/types/platform").FinancingOffer; request: ProductionRequest }>(
    token,
    `/manufacturer/requests/${requestId}/offers/${offerId}/accept`,
    { method: "POST" },
  );
}

export async function submitLenderOffer(
  token: string,
  requestId: string,
  payload: {
    offered_amount: number;
    interest_rate: number;
    tenor_days: number;
    instrument_type: string;
    conditions: string[];
    notes?: string;
    validity_days?: number;
  },
) {
  return platformFetchAuth<import("@/types/platform").FinancingOffer>(token, `/lender/requests/${requestId}/offer`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateLenderOffer(
  token: string,
  requestId: string,
  offerId: string,
  payload: {
    offered_amount: number;
    interest_rate: number;
    tenor_days: number;
    instrument_type: string;
    conditions: string[];
    notes?: string;
    validity_days?: number;
  },
) {
  return platformFetchAuth<import("@/types/platform").FinancingOffer>(
    token,
    `/lender/requests/${requestId}/offer/${offerId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export async function fetchLenderOffers(token: string) {
  const res = await platformFetchAuth<{ items: import("@/types/platform").FinancingOffer[] }>(token, "/lender/offers");
  return res.items;
}

export async function fetchInstrumentSuitability(token: string, requestId: string) {
  return platformFetchAuth<import("@/types/platform").InstrumentSuitability>(
    token,
    `/financing-requests/${requestId}/instrument-suitability`,
  );
}

export async function fetchManufacturerLifecycle(token: string, requestId: string) {
  return platformFetchAuth<import("@/types/platform").FinancingLifecycleView>(
    token,
    `/manufacturer/financing-requests/${requestId}/lifecycle`,
  );
}

export async function fetchLenderTransitions(token: string) {
  const res = await platformFetchAuth<{ items: import("@/types/platform").InstrumentTransitionSummary[] }>(
    token,
    "/lender/transitions",
  );
  return res.items;
}

export async function fetchTransitionDetail(token: string, transitionId: string) {
  return platformFetchAuth<import("@/types/platform").InstrumentTransitionDetail>(
    token,
    `/lender/transitions/${transitionId}`,
  );
}

export async function approveTransition(token: string, transitionId: string, notes?: string) {
  return platformFetchAuth(token, `/lender/transitions/${transitionId}/approve`, {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
}

export async function keepCurrentTransition(token: string, transitionId: string, notes?: string) {
  return platformFetchAuth(token, `/lender/transitions/${transitionId}/keep-current`, {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
}

export async function rejectTransition(token: string, transitionId: string, notes?: string) {
  return platformFetchAuth(token, `/lender/transitions/${transitionId}/reject`, {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
}

export async function requestTransitionEvidence(token: string, transitionId: string, notes?: string) {
  return platformFetchAuth(token, `/lender/transitions/${transitionId}/request-evidence`, {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
}

export async function fetchFinancingHealth(token: string, requestId: string) {
  return platformFetchAuth<import("@/types/platform").FinancingHealth>(token, `/manufacturer/financing-health/${requestId}`);
}

export async function fetchLenderReassessments(token: string, priority?: string) {
  const q = priority ? `?priority=${priority}` : "";
  const res = await platformFetchAuth<{ items: import("@/types/platform").ReassessmentRecord[] }>(token, `/lender/reassessments${q}`);
  return res.items;
}

export async function fetchReassessmentDetail(token: string, recordId: string) {
  return platformFetchAuth<import("@/types/platform").ReassessmentDetail>(token, `/lender/reassessments/${recordId}`);
}

export async function acknowledgeReassessment(token: string, recordId: string, notes?: string) {
  return platformFetchAuth(token, `/reassessments/${recordId}/acknowledge`, { method: "POST", body: JSON.stringify({ notes }) });
}

export async function continueMonitoring(token: string, recordId: string, notes?: string) {
  return platformFetchAuth(token, `/reassessments/${recordId}/continue-monitoring`, { method: "POST", body: JSON.stringify({ notes }) });
}

export async function requestReassessmentEvidence(token: string, recordId: string, notes?: string) {
  return platformFetchAuth(token, `/reassessments/${recordId}/request-evidence`, { method: "POST", body: JSON.stringify({ notes }) });
}

export async function triggerDemoReassessment(token: string) {
  return platformFetchAuth<{
    event: unknown;
    reassessment: { skipped?: boolean; record?: import("@/types/platform").ReassessmentRecord };
    request: import("@/types/platform").ProductionRequest;
  }>(token, "/lender/reassessments/trigger-demo", { method: "POST" });
}
