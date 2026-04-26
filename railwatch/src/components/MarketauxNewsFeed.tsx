import { useEffect, useRef, useState, memo } from 'react';
import type { NewsArticle, FetchState, ApiErrorType } from '../types/index';
import {
  readMarketauxCache,
  writeMarketauxCache,
  fetchMarketauxNews,
  readMarketauxCount,
  incrementMarketauxCount,
  MARKETAUX_MONTHLY_LIMIT,
} from '../api/marketaux';
import { useSetMarketauxArticles } from '../context/MarketauxContext';
import NewsSkeleton from './skeletons/NewsSkeleton';
import ErrorState from './ErrorState';
import { formatLocalTimestamp } from '../utils/format';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SENTIMENT_STYLES = {
  Positive: 'bg-green-100 text-green-800',
  Neutral:  'bg-gray-100  text-gray-700',
  Negative: 'bg-red-100   text-red-800',
};

function formatPublishedAt(iso: string): string {
  try {
    return formatLocalTimestamp(iso);
  } catch {
    return iso;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * MarketauxNewsFeed — fetches and displays 3–5 payments industry news articles.
 *
 * Cache strategy (Req 10.5):
 *   - Fresh (< 30 min): serve from cache, no fetch
 *   - Absent / expired: fetch (subject to monthly rate-limit guard)
 *
 * Monthly counter (Req 10.6–10.9):
 *   - Reads count before each fetch; skips if count ≥ 90
 *   - Increments counter only on successful fetch
 *
 * Writes article list to MarketauxContext so RailHealthCard can surface
 * relevant headlines for Degraded/Critical rails (Req 10.10, Req 5.11).
 *
 * Requirements: Req 10.1–10.13, Req 18.8
 */
function MarketauxNewsFeed() {
  const [articles,       setArticles]       = useState<NewsArticle[]>([]);
  const [fetchState,     setFetchState]     = useState<FetchState>('idle');
  const [errorType,      setErrorType]      = useState<ApiErrorType | null>(null);
  const [rateLimitReached, setRateLimitReached] = useState(false);
  const [lastFetchedAt,  setLastFetchedAt]  = useState<string | null>(null);

  const setContextArticles = useSetMarketauxArticles();
  const fetchingRef = useRef(false);

  function publishArticles(items: NewsArticle[]) {
    setArticles(items);
    setContextArticles(items); // Req 10.10 — write to context for RailHealthCard
  }

  async function doFetch() {
    if (fetchingRef.current) return;

    // Monthly rate-limit guard (Req 10.6)
    const count = readMarketauxCount();
    if (count >= MARKETAUX_MONTHLY_LIMIT) {
      setRateLimitReached(true);
      return;
    }

    fetchingRef.current = true;
    setFetchState('loading');
    setErrorType(null);

    try {
      const fetched = await fetchMarketauxNews();
      incrementMarketauxCount(); // only on success (Req 10.7)
      writeMarketauxCache(fetched);
      publishArticles(fetched);
      setLastFetchedAt(new Date().toISOString());
      setFetchState('success');
      setErrorType(null);

      // Check if limit reached after this fetch
      if (readMarketauxCount() >= MARKETAUX_MONTHLY_LIMIT) {
        setRateLimitReached(true);
      }
    } catch (err) {
      const type = (err instanceof Error ? err.message : 'network') as ApiErrorType;
      setErrorType(type);
      setFetchState('error');
      // Counter is NOT incremented on failed requests (Req 10.7)
    } finally {
      fetchingRef.current = false;
    }
  }

  // On mount: apply cache strategy
  useEffect(() => {
    const count = readMarketauxCount();
    if (count >= MARKETAUX_MONTHLY_LIMIT) {
      setRateLimitReached(true);
    }

    const cached = readMarketauxCache();
    if (cached) {
      publishArticles(cached.articles);
      setLastFetchedAt(cached.fetchedAt);
      setFetchState('success');
      // Cache is fresh — no fetch needed
    } else if (count < MARKETAUX_MONTHLY_LIMIT) {
      doFetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestCount = readMarketauxCount();

  // ── Render: loading ──────────────────────────────────────────────────────
  if (fetchState === 'idle' || fetchState === 'loading') {
    return <NewsSkeleton />;
  }

  // ── Render: error with no cache ──────────────────────────────────────────
  if (fetchState === 'error' && articles.length === 0) {
    return (
      <div>
        <ErrorState
          source="marketaux"
          errorType={errorType}
          lastFetchedAt={lastFetchedAt}
          cachedDataAvailable={false}
          onRetry={doFetch}
        />
      </div>
    );
  }

  // ── Render: rate limit reached with no articles ──────────────────────────
  if (rateLimitReached && articles.length === 0) {
    return (
      <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
        Live news paused — monthly limit reached. Updates resume next month.
      </div>
    );
  }

  // ── Render: articles ─────────────────────────────────────────────────────
  return (
    <div className="rounded-md border border-gray-200 bg-white p-3" aria-label="Payments industry news feed">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">Industry News</h3>
        <span className="text-xs text-gray-400">
          {requestCount}/{MARKETAUX_MONTHLY_LIMIT} requests this month
        </span>
      </div>

      {/* Rate limit warning (still showing cached articles) */}
      {rateLimitReached && (
        <div className="mb-2 rounded bg-yellow-50 border border-yellow-200 px-2 py-1 text-xs text-yellow-700">
          Live news paused — monthly limit reached. Updates resume next month.
        </div>
      )}

      {/* Article list — 3–5 items (Req 10.2) */}
      <ul className="space-y-3" role="list">
        {articles.slice(0, 5).map(article => (
          <li key={article.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
            {/* Headline */}
            <p className="text-sm text-gray-900 leading-snug">{article.headline}</p>

            {/* Meta row: source, timestamp, sentiment */}
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500">{article.source}</span>
              <span className="text-xs text-gray-400" aria-label={`Published at ${article.publishedAt}`}>
                {formatPublishedAt(article.publishedAt)}
              </span>
              <span
                className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${SENTIMENT_STYLES[article.sentimentLabel]}`}
                aria-label={`Sentiment: ${article.sentimentLabel}`}
              >
                {article.sentimentLabel}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* Error with stale cache fallback */}
      {fetchState === 'error' && articles.length > 0 && (
        <div className="mt-3">
          <ErrorState
            source="marketaux"
            errorType={errorType}
            lastFetchedAt={lastFetchedAt}
            cachedDataAvailable={true}
            onRetry={doFetch}
          />
        </div>
      )}

      {/* Last fetched timestamp */}
      {lastFetchedAt && fetchState !== 'error' && (
        <p className="mt-2 text-xs text-gray-400">
          Updated {formatPublishedAt(lastFetchedAt)}
        </p>
      )}
    </div>
  );
}

export default memo(MarketauxNewsFeed);
