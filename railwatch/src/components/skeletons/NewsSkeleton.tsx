/**
 * NewsSkeleton — loading placeholder matching MarketauxNewsFeed dimensions.
 * Rendered by MarketauxNewsFeed while fetchState === 'loading'.
 * Mimics 3–5 article rows: headline, source + timestamp + sentiment badge.
 */
const ARTICLE_COUNT = 4;

export default function NewsSkeleton() {
  return (
    <div className="animate-pulse space-y-3" aria-busy="true" aria-label="Loading news feed">
      {Array.from({ length: ARTICLE_COUNT }).map((_, i) => (
        <div key={i} className="space-y-1.5 pb-3 border-b border-gray-100 last:border-0">
          {/* Headline — two lines */}
          <div className="h-3.5 bg-gray-200 rounded w-full" />
          <div className="h-3.5 bg-gray-200 rounded w-4/5" />
          {/* Source + timestamp + sentiment badge */}
          <div className="flex items-center gap-2 mt-1">
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-4 w-14 bg-gray-200 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
