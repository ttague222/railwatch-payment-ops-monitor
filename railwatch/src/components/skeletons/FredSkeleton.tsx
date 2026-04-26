/**
 * FredSkeleton — loading placeholder matching FredIndicator dimensions.
 * Rendered by FredIndicator while fetchState === 'loading'.
 */
export default function FredSkeleton() {
  return (
    <div className="animate-pulse space-y-2 p-3" aria-busy="true" aria-label="Loading interest rate data">
      {/* Label row: "Fed Rate: X.XX%" */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-20 bg-gray-200 rounded" />
        <div className="h-5 w-16 bg-gray-300 rounded" />
      </div>
      {/* Observation date */}
      <div className="h-3 w-28 bg-gray-200 rounded" />
      {/* MoM change */}
      <div className="h-3 w-24 bg-gray-200 rounded" />
    </div>
  );
}
