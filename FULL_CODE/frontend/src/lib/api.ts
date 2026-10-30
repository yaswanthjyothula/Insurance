/** The one place the app talks to the backend. Adds the session token, a timeout, and readable errors. */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
const TOKEN_KEY = "lifesure_session_token";
const DEFAULT_TIMEOUT_MS = 45_000;

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage can be blocked, the session then lasts until the page reloads */
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** FastAPI sends {detail: "text"} or, for validation, {detail: [{loc, msg}]}. Turn either into one sentence. */
function messageFrom(body: unknown, status: number): string {
  const detail = (body as { detail?: unknown; message?: string } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) {
    const first = detail[0] as { loc?: unknown[]; msg?: string };
    const where = Array.isArray(first.loc) ? first.loc.filter((p) => p !== "body").join(" › ") : "";
    return `${where ? `${where}: ` : ""}${first.msg ?? "Please check what you entered."}`;
  }
  return status >= 500 ? "Something went wrong on our side. Please try again." : `Request failed (${status}).`;
}

export async function fetchFromAPI<T = unknown>(endpoint: string, options: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, headers, signal: callerSignal, ...init } = options;
  const token = getToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  // A caller (e.g. a hook discarding an outdated request) can cancel too: either signal aborts the same request
  callerSignal?.addEventListener("abort", () => controller.abort(), { once: true });
  const isForm = typeof FormData !== "undefined" && init.body instanceof FormData;
  try {
    const res = await fetch(`${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`, {
      ...init,
      signal: controller.signal,
      headers: {
        ...(isForm ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(messageFrom(body, res.status), res.status);
    return body as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if ((error as Error).name === "AbortError") throw new ApiError("The server took too long to answer. Please try again.", 0);
    throw new ApiError("We couldn't reach the server. Make sure the backend is running and try again.", 0);
  } finally {
    clearTimeout(timer);
  }
}

export const postJSON = <T = unknown>(endpoint: string, body: unknown, options: RequestInit & { timeoutMs?: number } = {}) =>
  fetchFromAPI<T>(endpoint, { method: "POST", body: JSON.stringify(body), ...options });
