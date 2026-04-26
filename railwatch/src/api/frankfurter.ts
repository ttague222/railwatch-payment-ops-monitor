import type { FxRate, FxCacheEntry, ApiErrorType } from '../types/index';

// ─── Constants ────────────────────────────────────────────────────────────────

const FX_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const FX_FETCH_TIMEOUT_MS = 5000;

// ─── Session Cache ────────────────────────────────────────────────────────────

/** Module-level session cache — persists for the browser session, cleared on reload. */
export const fxSessionCache = new Map<string, FxCacheEntry>();

// ─── Cache Helpers ────────────────────────────────────────────────────────────

/**
 * Read an FX rate from the session cache.
 * Returns null if absent or expired (> 15 minutes).
 */
export function readFxCache(currency: string): FxRate | null {
  const entry = fxSessionCache.get(currency);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > FX_CACHE_TTL_MS) {
    fxSessionCache.delete(currency);
    return null;
  }
  return entry.rate;
}

/**
 * Write an FX rate to the session cache.
 */
export function writeFxCache(currency: string, rate: FxRate): void {
  fxSessionCache.set(currency, { rate, fetchedAt: Date.now() });
}

// ─── Raw API Shape ────────────────────────────────────────────────────────────

interface FrankfurterApiResponse {
  base: string;                    // "USD"
  date: string;                    // "YYYY-MM-DD"
  rates: Record<string, number>;
}

// ─── Response Mapping ─────────────────────────────────────────────────────────

/**
 * Map a raw Frankfurter API response to the internal FxRate shape.
 * Returns null if the target currency is not present in the rates object.
 * Throws 'malformed' if the response structure is invalid.
 */
export function mapFrankfurterResponse(
  raw: FrankfurterApiResponse,
  toCurrency: string,
): FxRate | null {
  if (!raw?.rates || typeof raw.rates !== 'object') {
    throw new Error('malformed');
  }
  if (!(toCurrency in raw.rates)) {
    return null; // unsupported currency — not an error
  }
  return {
    fromCurrency: 'USD',
    toCurrency,
    rate: raw.rates[toCurrency],
    date: raw.date,
    fetchedAt: new Date().toISOString(),
  };
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

/**
 * Fetch the latest USD → toCurrency rate from Frankfurter with a 5s timeout.
 * Resolves with FxRate on success, or null if the currency is unsupported.
 * Rejects with an Error whose message is one of: 'timeout' | 'network' | 'malformed'.
 */
export async function fetchFxRate(toCurrency: string): Promise<FxRate | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FX_FETCH_TIMEOUT_MS);

  try {
    let response: Response;
    try {
      response = await fetch(
        `https://api.frankfurter.app/latest?from=USD&to=${encodeURIComponent(toCurrency)}`,
        { signal: controller.signal },
      );
    } catch (err) {
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      const errorType: ApiErrorType = isAbort ? 'timeout' : 'network';
      throw new Error(errorType);
    }

    if (!response.ok) {
      throw new Error('malformed');
    }

    let json: FrankfurterApiResponse;
    try {
      json = await response.json();
    } catch {
      throw new Error('malformed');
    }

    return mapFrankfurterResponse(json, toCurrency);
  } finally {
    clearTimeout(timer);
  }
}
