import { useEffect, useRef, useState, memo } from 'react';
import type { FredIndicatorData, FetchState, ApiErrorType } from '../types/index';
import { readFredCache, writeFredCache, fetchFredRate } from '../api/fred';
import FredSkeleton from './skeletons/FredSkeleton';
import ErrorState from './ErrorState';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRate(rate: number): string {
  return rate.toFixed(2) + '%';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function MomChangeLabel({ change }: { change: number }) {
  if (change === 0) {
    return <span className="text-gray-500 text-xs">No change from prior month</span>;
  }
  const sign   = change > 0 ? '+' : '';
  const color  = change > 0 ? 'text-red-600' : 'text-green-600';
  const arrow  = change > 0 ? '▲' : '▼';
  return (
    <span className={`text-xs font-medium ${color}`} aria-label={`Month-over-month change: ${sign}${change.toFixed(2)}%`}>
      {arrow} {sign}{change.toFixed(2)}% MoM
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * FredIndicator — displays the current Federal Funds Rate from the FRED API.
 *
 * Cache strategy (Req 8.3):
 *   - Fresh (< 4h):  serve from cache, no fetch
 *   - Stale (4–24h): serve from cache + background re-fetch
 *   - Absent / > 24h: fetch immediately
 *
 * Requirements: Req 8.1–8.8, Req 11, Req 12.4
 */
function FredIndicator() {
  const [data,       setData]       = useState<FredIndicatorData | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>('idle');
  const [errorType,  setErrorType]  = useState<ApiErrorType | null>(null);
  const [isStale,    setIsStale]    = useState(false);

  // Prevent duplicate in-flight fetches (e.g. background + manual retry)
  const fetchingRef = useRef(false);

  async function doFetch(isBackground = false) {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    if (!isBackground) {
      setFetchState('loading');
      setErrorType(null);
    }

    try {
      const fresh = await fetchFredRate();
      writeFredCache(fresh);
      setData(fresh);
      setIsStale(false);
      setFetchState('success');
      setErrorType(null);
    } catch (err) {
      const type = (err instanceof Error ? err.message : 'network') as ApiErrorType;
      if (!isBackground) {
        // Only surface the error when there's no cached data to fall back on
        setErrorType(type);
        setFetchState('error');
      }
      // If background fetch fails, keep showing the stale cached data silently
    } finally {
      fetchingRef.current = false;
    }
  }

  // On mount: apply cache strategy
  useEffect(() => {
    const cached = readFredCache();

    if (cached) {
      setData(cached.data);
      setIsStale(cached.isStale);
      setFetchState('success');

      if (cached.isStale) {
        // Stale: show cached data immediately, re-fetch in background
        doFetch(true);
      }
      // Fresh: nothing more to do
    } else {
      // Absent or expired: fetch immediately
      doFetch(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render: loading ──────────────────────────────────────────────────────
  if (fetchState === 'idle' || fetchState === 'loading') {
    return <FredSkeleton />;
  }

  // ── Render: error with no cache ──────────────────────────────────────────
  if (fetchState === 'error' && !data) {
    return (
      <ErrorState
        source="fred"
        errorType={errorType}
        lastFetchedAt={null}
        cachedDataAvailable={false}
        onRetry={() => doFetch(false)}
      />
    );
  }

  // ── Render: data (possibly stale) ────────────────────────────────────────
  if (!data) return null;

  return (
    <div className="rounded-md border border-gray-200 bg-white p-3 text-sm" aria-label="Federal Funds Rate indicator">
      {/* Primary rate display — Req 8.1 */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-gray-700">Fed Rate</span>
        <span className="text-lg font-bold text-gray-900" aria-label={`Federal Funds Rate: ${formatRate(data.currentRate)}`}>
          {formatRate(data.currentRate)}
        </span>
      </div>

      {/* Observation date — Req 8.1, 8.8 */}
      <p className="mt-1 text-xs text-gray-500">
        As of {formatDate(data.currentDate)}
      </p>

      {/* MoM change — Req 8.2 */}
      <div className="mt-1">
        <MomChangeLabel change={data.momChange} />
      </div>

      {/* Stale data indicator — Req 8.4 */}
      {isStale && (
        <div
          role="status"
          aria-label="Stale data indicator"
          className="mt-2 flex items-center gap-1 rounded bg-yellow-50 px-2 py-1 text-xs text-yellow-700 border border-yellow-200"
        >
          <svg aria-hidden="true" className="h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Stale data — last fetched {formatDate(data.fetchedAt)}
        </div>
      )}

      {/* Error with stale cache fallback — Req 8.4, 8.5 */}
      {fetchState === 'error' && data && (
        <div className="mt-2">
          <ErrorState
            source="fred"
            errorType={errorType}
            lastFetchedAt={data.fetchedAt}
            cachedDataAvailable={true}
            onRetry={() => doFetch(false)}
          />
        </div>
      )}
    </div>
  );
}

export default memo(FredIndicator);
