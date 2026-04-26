import { memo, useState } from 'react';
import type { ApiErrorType } from '../types/index';

interface ErrorStateProps {
  source: string;
  errorType: ApiErrorType | null;
  lastFetchedAt: string | null;
  cachedDataAvailable: boolean;
  onRetry: () => void;
}

function getErrorMessage(source: string, errorType: ApiErrorType | null): string {
  const s = source.toLowerCase();

  if (s === 'fred') {
    if (errorType === 'timeout')   return 'Interest rate data is taking too long to load. Showing last known rate.';
    if (errorType === 'network')   return 'Unable to reach the Federal Reserve data service. Showing last known rate.';
    if (errorType === 'malformed') return 'Interest rate data is currently unavailable. Showing last known rate.';
  }

  if (s === 'frankfurter') {
    if (errorType === 'timeout')   return 'FX rate timed out. USD amount shown.';
    if (errorType === 'network')   return 'FX rate unavailable. USD amount shown.';
    if (errorType === 'malformed') return 'Rate data is currently unavailable.';
  }

  if (s === 'marketaux') {
    if (errorType === 'timeout')   return 'News feed timed out. Showing last available headlines.';
    if (errorType === 'network')   return 'Unable to reach news service. Showing last available headlines.';
    if (errorType === 'malformed') return 'News data is currently unavailable.';
  }

  // Generic fallback for unknown sources
  if (errorType === 'timeout')   return 'This section is taking too long to load.';
  if (errorType === 'network')   return 'Unable to reach this service.';
  if (errorType === 'malformed') return 'Data is currently unavailable.';
  return 'An unexpected error occurred.';
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/**
 * Standard error display component used by all API sections.
 * Req 11.1–11.5
 */
const ErrorState = memo(function ErrorState({
  source,
  errorType,
  lastFetchedAt,
  cachedDataAvailable,
  onRetry,
}: ErrorStateProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const message = getErrorMessage(source, errorType);

  async function handleRetry() {
    if (isRetrying) return; // block duplicate retries (Req 11.4)
    setIsRetrying(true);
    try {
      await Promise.resolve(onRetry());
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex flex-col items-start gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
    >
      {/* Error icon + message (Req 11.1) */}
      <div className="flex items-center gap-2">
        <svg
          aria-hidden="true"
          className="h-5 w-5 flex-shrink-0 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
        <span>{message}</span>
      </div>

      {/* Last-fetch timestamp (Req 11.2) */}
      {lastFetchedAt && (
        <p className="text-xs text-red-600">
          Last successful fetch: {formatTimestamp(lastFetchedAt)}
        </p>
      )}

      {cachedDataAvailable && (
        <p className="text-xs text-red-600">Showing cached data.</p>
      )}

      {/* Retry button or loading indicator (Req 11.3, 11.4) */}
      {isRetrying ? (
        <div
          role="status"
          aria-label="Retrying…"
          className="flex items-center gap-2 text-xs text-red-600"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          Retrying…
        </div>
      ) : (
        <button
          type="button"
          onClick={handleRetry}
          className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
        >
          Retry
        </button>
      )}
    </div>
  );
});

export default ErrorState;
