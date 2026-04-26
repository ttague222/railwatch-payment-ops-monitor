/**
 * FxSkeleton — loading placeholder matching FxConversionInline dimensions.
 * Rendered by FxConversionInline while fetchState === 'loading'.
 * Matches the single-line "{amount} USD = {converted} {currency}" layout.
 */
export default function FxSkeleton() {
  return (
    <div className="animate-pulse flex items-center gap-2 py-1" aria-busy="true" aria-label="Loading FX rate">
      {/* USD amount */}
      <div className="h-3 w-20 bg-gray-200 rounded" />
      <div className="h-3 w-4 bg-gray-200 rounded" />
      {/* Converted amount + currency */}
      <div className="h-3 w-24 bg-gray-200 rounded" />
    </div>
  );
}
