import { API_BASE_URL, ApiError, apiFetch } from "@/lib/api/client";

export async function platformFetch<T>(path: string, init?: RequestInit, timeoutMs = 8000): Promise<T> {
  return apiFetch<T>(path, init, timeoutMs);
}

export function platformFetchAuth<T>(
  token: string,
  path: string,
  init?: RequestInit,
  timeoutMs = 8000,
): Promise<T> {
  return platformFetch<T>(
    path,
    {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    },
    timeoutMs,
  );
}

export { API_BASE_URL, ApiError };
