/**
 * Shared formatting utilities for monetary values, percentages, and timestamps.
 * All timestamp functions render in the user's local timezone.
 */

export function formatUSD(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPercent(value: number): string {
  return value.toFixed(2) + '%';
}

export function formatLocalTimestamp(isoString: string): string {
  return new Date(isoString).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
