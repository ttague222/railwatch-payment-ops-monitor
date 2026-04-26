import { useState, useMemo } from 'react';
import type { ExceptionGroup, Transaction, PaymentRail } from '../types';
import FxConversionInline from './FxConversionInline';
import { formatUSD } from '../utils/format';

// ─── Prop Types ───────────────────────────────────────────────────────────────

export interface FxConversionInlineProps {
  instructedAmount: number;
  destinationCurrency: string;
  /** Timestamp (Date.now()) of the last successful FX fetch for this currency */
  fxLastFetch: number | undefined;
  onRetry: () => void;
}

export interface ApiErrorBoundaryFxProps {
  /** Retry callbacks keyed by currency code, passed down from ExceptionDrillDown */
  retryFx: Record<string, () => void>;
}

export interface ExceptionDrillDownProps {
  group: ExceptionGroup;
}

// ─── SLA Thresholds ──────────────────────────────────────────────────────────

const SLA_THRESHOLDS: Record<PaymentRail, { warningHours: number; breachHours: number }> = {
  FedNow:             { warningHours: 4,  breachHours: 8  },
  RTP:                { warningHours: 4,  breachHours: 8  },
  ACH_Same_Day:       { warningHours: 4,  breachHours: 8  },
  Wire_Domestic:      { warningHours: 24, breachHours: 48 },
  Wire_International: { warningHours: 24, breachHours: 48 },
  ACH_Standard:       { warningHours: 48, breachHours: 72 },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatAge(openedAt: string): string {
  const ageMs = Date.now() - new Date(openedAt).getTime();
  const totalMinutes = Math.floor(ageMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

type SlaStatus = 'breach' | 'warning' | 'ok';

function getSlaStatus(openedAt: string, rail: PaymentRail): SlaStatus {
  const ageHours = (Date.now() - new Date(openedAt).getTime()) / 3_600_000;
  const { warningHours, breachHours } = SLA_THRESHOLDS[rail];
  if (ageHours >= breachHours) return 'breach';
  if (ageHours >= warningHours) return 'warning';
  return 'ok';
}

// ─── SLA Badge ────────────────────────────────────────────────────────────────

function SlaBadge({ status }: { status: SlaStatus }) {
  if (status === 'breach') {
    return (
      <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold bg-red-100 text-red-700">
        <span aria-hidden="true">●</span> SLA Breach
      </span>
    );
  }
  if (status === 'warning') {
    return (
      <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-700">
        <span aria-hidden="true">●</span> SLA Warning
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700">
      <span aria-hidden="true">●</span> Within SLA
    </span>
  );
}



// ─── Transaction Row ─────────────────────────────────────────────────────────

function TransactionRow({
  tx,
  fxLastFetch,
  onRetryFx,
}: {
  tx: Transaction;
  fxLastFetch: Record<string, number>;
  onRetryFx: (transactionId: string) => void;
}) {
  const slaStatus = getSlaStatus(tx.openedAt, tx.rail);
  const isWireIntl = tx.rail === 'Wire_International';

  return (
    <li className="flex flex-col gap-1 rounded border border-gray-200 bg-white px-3 py-2 text-xs">
      {/* Top row: ID + Demo Data label */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-gray-700 truncate" title={tx.transactionId}>
          {tx.transactionId}
        </span>
        <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-blue-600 font-medium text-[10px] uppercase tracking-wide">
          Demo Data
        </span>
      </div>

      {/* Middle row: amount, age, SLA badge */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-gray-900">{formatUSD(tx.amount)}</span>
        <span className="text-gray-500">Age: {formatAge(tx.openedAt)}</span>
        <SlaBadge status={slaStatus} />
      </div>

      {/* Bottom row: reason code + namespace + optional FX */}
      <div className="flex flex-wrap items-center gap-2 text-gray-600">
        {tx.reasonCode && (
          <span>
            <span className="font-medium">{tx.reasonCode}</span>
            {tx.reasonCodeNamespace && (
              <span className="ml-1 text-gray-400">({tx.reasonCodeNamespace})</span>
            )}
          </span>
        )}
        {isWireIntl && tx.destinationCurrency && (
          <FxConversionInline
            instructedAmount={tx.instructedAmount}
            destinationCurrency={tx.destinationCurrency}
            fxLastFetch={fxLastFetch[tx.transactionId]}
            onRetry={() => onRetryFx(tx.transactionId)}
          />
        )}
      </div>
    </li>
  );
}

// ─── ExceptionDrillDown ───────────────────────────────────────────────────────

function ExceptionDrillDown({ group }: ExceptionDrillDownProps) {
  // FX fetch state is scoped to ExceptionDrillDown to avoid stale closures across multiple drill-down instances
  const [fxLastFetch, setFxLastFetch] = useState<Record<string, number>>({});

  // Sort transactions by dollar exposure (amount) descending, show first 10
  const sorted = useMemo(
    () => [...group.transactions].sort((a, b) => b.amount - a.amount),
    [group.transactions]
  );

  const displayed = sorted.slice(0, 10);
  const remaining = sorted.length - displayed.length;

  function handleRetryFx(transactionId: string) {
    setFxLastFetch(prev => ({ ...prev, [transactionId]: Date.now() }));
  }

  return (
    <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
      <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Transactions ({group.count} total
        {remaining > 0 ? `, showing first 10 by exposure` : ''})
      </p>

      <ul className="flex flex-col gap-2">
        {displayed.map(tx => (
          <TransactionRow
            key={tx.transactionId}
            tx={tx}
            fxLastFetch={fxLastFetch}
            onRetryFx={handleRetryFx}
          />
        ))}
      </ul>

      {remaining > 0 && (
        <p className="mt-2 text-xs text-gray-400">
          + {remaining} more transaction{remaining !== 1 ? 's' : ''} not shown
        </p>
      )}
    </div>
  );
}

export default ExceptionDrillDown;
