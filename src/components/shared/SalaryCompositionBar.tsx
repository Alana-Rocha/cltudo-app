'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/format';
import type { CalculationResult } from '@/engine/types';

// Color follows the entity, so a missing deduction never repaints the others.
const SLOT_BY_KEY: Record<string, number> = { net: 1, inss: 2, irrf: 3, vt: 4, alimony: 5, other: 6 };

type Segment = { key: string; label: string; amount: number };

function formatPercent(part: number, whole: number): string {
  return `${((part / whole) * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function SalaryCompositionBar({ result }: { result: CalculationResult }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const gross = result.totals.gross;

  const segments: Segment[] = [
    { key: 'net', label: 'Líquido', amount: result.totals.net },
    ...result.items
      .filter((i) => i.type === 'deduction' && i.amount > 0)
      .map((i) => ({ key: i.key, label: i.label, amount: i.amount })),
  ].filter((s) => s.amount > 0 && SLOT_BY_KEY[s.key] !== undefined);

  if (gross <= 0 || result.totals.net < 0 || segments.length < 2) return null;

  const active = segments.find((s) => s.key === hovered);

  return (
    <div className="viz mx-auto mt-5 max-w-md text-left">
      <p className="h-5 text-xs text-gray-500" aria-hidden="true">
        {active
          ? `${active.label}: ${formatCurrency(active.amount)} (${formatPercent(active.amount, gross)} do bruto)`
          : 'Para onde vai o salário bruto'}
      </p>

      <div className="mt-1 flex h-6 items-center gap-[2px]" aria-hidden="true" onMouseLeave={() => setHovered(null)}>
        {segments.map((s, i) => (
          <div
            key={s.key}
            className="flex h-full items-center"
            style={{ width: `${(s.amount / gross) * 100}%`, minWidth: 3 }}
            onMouseEnter={() => setHovered(s.key)}
          >
            <div
              className={`h-3 w-full transition-opacity ${i === 0 ? 'rounded-l' : ''} ${i === segments.length - 1 ? 'rounded-r' : ''}`}
              style={{
                background: `var(--series-${SLOT_BY_KEY[s.key]})`,
                opacity: hovered && hovered !== s.key ? 0.35 : 1,
              }}
            />
          </div>
        ))}
      </div>

      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {segments.map((s) => (
          <li
            key={s.key}
            className="flex items-center gap-1.5"
            onMouseEnter={() => setHovered(s.key)}
            onMouseLeave={() => setHovered(null)}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: `var(--series-${SLOT_BY_KEY[s.key]})` }}
              aria-hidden="true"
            />
            <span className="text-gray-600">{s.label}</span>
            <span className="tabular-nums text-gray-500">{formatPercent(s.amount, gross)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
