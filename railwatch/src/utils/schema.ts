export const CURRENT_SCHEMA_VERSION = '1.0.0';

const SCHEMA_KEY = 'railwatch_schema_version';

/**
 * Reads the stored schema version from LocalStorage.
 * If absent or mismatched, clears all railwatch_* keys and writes the current version.
 * Called at app startup before React renders (in main.tsx).
 */
export function migrateIfNeeded(): void {
  try {
    const stored = localStorage.getItem(SCHEMA_KEY);
    if (stored === CURRENT_SCHEMA_VERSION) return;

    // Clear all railwatch_* keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('railwatch_')) keysToRemove.push(key);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // Write current version
    localStorage.setItem(SCHEMA_KEY, CURRENT_SCHEMA_VERSION);
  } catch {
    // LocalStorage unavailable — proceed silently
  }
}
