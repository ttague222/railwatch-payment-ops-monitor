import { memo } from 'react';

/**
 * Persistent, non-dismissible banner indicating Demo Mode.
 * Max height 48px per Req 1.2.
 */
const DemoModeBanner = memo(function DemoModeBanner() {
  return (
    <div
      role="banner"
      aria-label="Demo mode notice"
      className="w-full bg-yellow-400 text-yellow-900 text-center text-sm font-semibold py-2 px-4"
      style={{ maxHeight: '48px' }}
    >
      DEMO MODE — Simulated Data
    </div>
  );
});

export default DemoModeBanner;
