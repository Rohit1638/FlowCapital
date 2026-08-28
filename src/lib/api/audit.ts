import { apiFetch } from "@/lib/api/client";

export function listCloudAudit() {
  return apiFetch("/audit");
}
