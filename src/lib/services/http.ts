import "server-only";

/**
 * Result wrapper for external provider calls. Every service function returns
 * this instead of throwing for expected failure modes (not configured, rate
 * limited, provider error, timeout) so callers can render an honest
 * "data unavailable" state instead of crashing or showing stale/fake data.
 * Throwing is reserved for genuine programmer errors.
 */
export type ProviderResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "not_configured" | "not_found" | "rate_limited" | "provider_error" | "timeout"; detail?: string };

const DEFAULT_TIMEOUT_MS = 10_000;

export async function fetchJson<T>(
  url: string,
  init?: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<ProviderResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });

    if (response.status === 404) {
      return { ok: false, reason: "not_found" };
    }
    if (response.status === 429) {
      return { ok: false, reason: "rate_limited" };
    }
    if (!response.ok) {
      return { ok: false, reason: "provider_error", detail: `HTTP ${response.status}` };
    }

    const data = (await response.json()) as T;
    return { ok: true, data };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, reason: "timeout" };
    }
    return { ok: false, reason: "provider_error", detail: err instanceof Error ? err.message : "Unknown error" };
  } finally {
    clearTimeout(timeout);
  }
}
