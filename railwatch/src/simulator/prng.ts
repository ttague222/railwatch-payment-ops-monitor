/**
 * Seeded PRNG utility — mulberry32 algorithm.
 * Used for deterministic 7-day historical volume generation.
 * Math.random() is NOT used inside seededRandom — it is not seedable.
 */

/**
 * Returns a seeded pseudo-random number generator using the mulberry32 algorithm.
 * Each call to the returned function advances the internal state and returns
 * a float in [0, 1).
 */
export function seededRandom(seed: number): () => number {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Converts an ISO date string ("YYYY-MM-DD") to a numeric seed
 * by stripping dashes and parsing as an integer.
 * Example: "2025-04-25" → 20250425
 */
export function dateStringToSeed(dateStr: string): number {
  return parseInt(dateStr.replace(/-/g, ''), 10);
}
