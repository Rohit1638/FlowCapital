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
