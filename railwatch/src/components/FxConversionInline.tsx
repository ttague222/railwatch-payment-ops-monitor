import { useState, useEffect } from 'react';
import type { FxRate, FetchState, ApiErrorType } from '../types/index';
import { readFxCache, writeFxCache, fetchFxRate } from '../api/frankfurter';
import FxSkeleton from './skeletons/FxSkeleton';
import ErrorState from './ErrorState';

// ─── Props ────────────────────────────────────────────────────────────────────

interface FxConversionInlineProps {
  instructedAmount: number;
  destinationCurrency: string;
  /** Timestamp (Date.now()) of the last successful FX fetch — used to trigger re-fetch on retry */
  fxLastFetch: number | undefined;
  onRetry: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Fetches the USD → destinationCurrency FX rate on mount (not on page load).
 * Checks session cache first; falls back to Frankfurter API on miss.
 * Displays: "{instructedAmount} USD = {convertedAmount} {currency}"
 */
function FxConversionInline({
  instructedAmount,
  destinationCurrency,
  fxLastFetch,
  onRetry,
}: FxConversionInlineProps) {
  const [rate, setRate] = useState<FxRate | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>('idle');
  const [errorType, setErrorType] = useState<ApiErrorType | null>(null);
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Check session cache first
      const cached = readFxCache(destinationCurrency);
      if (cached) {
        if (!cancelled) {
          setRate(cached);
          setFetchState('success');
          setUnsupported(false);
        }
        return;
      }

      setFetchState('loading');
      setErrorType(null);
      setUnsupported(false);

      try {
        const result = await fetchFxRate(destinationCurrency);
        if (cancelled) return;

        if (result === null) {
          // Currency not supported by Frankfurter
          setUnsupported(true);
          setFetchState('success');
        } else {
          writeFxCache(destinationCurrency, result);
          setRate(result);
          setFetchState('success');
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'network';
        const type: ApiErrorType =
          msg === 'timeout' ? 'timeout' : msg === 'malformed' ? 'malformed' : 'network';
        setErrorType(type);
        setFetchState('error');
      }
    }

    load();
    return () => { cancelled = true; };
    // fxLastFetch changes when the user hits Retry — re-run the effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationCurrency, fxLastFetch]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (fetchState === 'idle' || fetchState === 'loading') {
    return <FxSkeleton />;
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (fetchState === 'error') {
    return (
      <ErrorState
        source="frankfurter"
        errorType={errorType}
        lastFetchedAt={rate?.fetchedAt ?? null}
        cachedDataAvailable={rate !== null}
        onRetry={onRetry}
      />
    );
  }

  // ── Unsupported currency ─────────────────────────────────────────────────
  if (unsupported) {
    return (
      <span className="text-xs text-gray-500 italic">
        Rate unavailable for {destinationCurrency}
      </span>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (rate) {
    const convertedAmount = (instructedAmount * rate.rate).toFixed(4);
    return (
      <span className="text-xs text-gray-700">
        {instructedAmount} USD = {convertedAmount} {destinationCurrency}
      </span>
    );
  }

  return null;
}

export default FxConversionInline;
