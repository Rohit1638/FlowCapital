export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    const body = (await response.json().catch(() => ({}))) as {
      error?: { message?: string };
    } & T;
    if (!response.ok) {
      throw new ApiError(body.error?.message ?? `Request failed (${response.status})`, response.status);
    }
    return body as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const message =
      error instanceof Error
        ? error.name === "AbortError"
          ? "Request timed out — is the backend running?"
          : error.message
        : "Network error";
    throw new ApiError(message, 0);
  } finally {
    clearTimeout(timer);
  }
}
