import { useState, useEffect, useCallback } from 'react';
import { CURRENT_SCHEMA_VERSION } from '../utils/schema';

const SCHEMA_KEY = 'railwatch_schema_version';

const SECTIONS = [
  'Status Bar',
  'Rail Health Overview',
  'Exception Queue',
  'Settlement Position',
  'Market Context',
];

/**
 * Shown on first load (no prior session data in LocalStorage).
 * Dismissible via click or keypress (Escape, Enter, Space).
 * Writes schema version to LocalStorage on dismiss.
 * If LocalStorage is unavailable, skips overlay entirely (Req 3.5).
 */
export default function FirstRunOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SCHEMA_KEY);
      if (!stored) setVisible(true);
    } catch {
      // LocalStorage unavailable — skip overlay
    }
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(SCHEMA_KEY, CURRENT_SCHEMA_VERSION);
    } catch {
      // ignore
    }
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') dismiss();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, dismiss]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to RailWatch"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={dismiss}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-2">Welcome to RailWatch</h2>
        <p className="text-sm text-gray-600 mb-4">
          This dashboard operates in <strong>Demo Mode</strong> — all payment data is
          realistically simulated and does not reflect real transactions.
        </p>
        <p className="text-sm font-semibold mb-2">Dashboard sections:</p>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mb-6">
          {SECTIONS.map(s => <li key={s}>{s}</li>)}
        </ul>
        <button
          onClick={dismiss}
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
