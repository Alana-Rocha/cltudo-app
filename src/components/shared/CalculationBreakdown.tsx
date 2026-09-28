'use client';

import { useEffect, useState } from 'react';
import { formatCurrency, formatDecimal } from '@/lib/format';
import type { CalculationResult } from '@/engine/types';
import { ResultActions } from './ResultActions';

function formatStepValue(value: number, unit: 'currency' | 'days' | 'hours' | undefined): string {
  if (unit === 'days') return `${value} dia${value === 1 ? '' : 's'}`;
  if (unit === 'hours') return `${formatDecimal(value / 100, 2)}h`;
  return formatCurrency(value);
}

function formatRulesVersion(id: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(id);
  if (!match) return id;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

type Headline = { label: string; field?: 'net' | 'deductions'; absolute?: boolean };

export function CalculationBreakdown({
  result,
  headline,
  summary,
}: {
  result: CalculationResult;
  headline: Headline;
  summary?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rawHeadline = result.totals[headline.field ?? 'net'];
  const headlineValue = headline.absolute ? Math.abs(rawHeadline) : rawHeadline;
  const isMonetary = result.totals.gross !== 0 || result.totals.deductions !== 0 || result.totals.net !== 0;

  // Announce only once the result settles, not on every keystroke of a live calculation.
  const summaryText = isMonetary
    ? `${headline.label}: ${formatCurrency(headlineValue)}`
    : result.items.map((i) => `${i.label}: ${i.explanation}`).join('. ');
  const [announcement, setAnnouncement] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setAnnouncement(summaryText), 1000);
    return () => clearTimeout(timer);
  }, [summaryText]);

  return (
    <div className="mt-6 rounded-lg border bg-white">
      {isMonetary && (
        <div className="border-b p-6 text-center">
          <p className="text-sm text-gray-500">{headline.label}</p>
          <p className="text-3xl font-bold text-brand-700">{formatCurrency(headlineValue)}</p>
          {summary}
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <ul className="divide-y">
        {result.items.map((item) => (
          <li key={item.key} className="flex items-center justify-between gap-4 px-6 py-3">
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-gray-500">{item.explanation}</p>
            </div>
            {item.type === 'info' ? (
              item.amount !== 0 && (
                <span className="shrink-0 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.amount)}</span>
              )
            ) : (
              <span
                className={`shrink-0 whitespace-nowrap font-medium ${
                  item.type === 'deduction' || item.amount < 0 ? 'text-red-600' : 'text-gray-900'
                }`}
              >
                {item.type === 'deduction' && item.amount >= 0 ? '− ' : ''}
                {formatCurrency(Math.abs(item.amount))}
              </span>
            )}
          </li>
        ))}
      </ul>

      {result.warnings.length > 0 && (
        <div className="border-t bg-amber-50 px-6 py-3 text-sm text-amber-800">
          {result.warnings.map((w, i) => (
            <p key={i}>{w}</p>
          ))}
        </div>
      )}

      {(result.included.length > 0 || result.excluded.length > 0) && (
        <div className="grid gap-4 border-t p-6 sm:grid-cols-2">
          {result.included.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-brand-700">Verbas incluídas</p>
              <ul className="space-y-1 text-sm text-gray-600">
                {result.included.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          )}
          {result.excluded.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-500">Verbas não devidas</p>
              <ul className="space-y-1 text-sm text-gray-500">
                {result.excluded.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="border-t p-6">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="text-sm font-medium text-brand-700 underline print:hidden"
        >
          Como chegamos a esse valor?
        </button>
        {/* Sempre impresso, mesmo fechado na tela. */}
        {result.steps.length > 0 && (
          <table className={`mt-4 w-full text-sm ${open ? '' : 'hidden print:table'}`}>
            <tbody>
              {result.steps.map((step, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 pr-4 text-gray-500">{step.label}</td>
                  <td className="py-2 pr-4 font-mono text-xs text-gray-400">{step.formula}</td>
                  <td className="py-2 text-right font-medium">{formatStepValue(step.value, step.unit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="mt-4 text-xs text-gray-400">
          Cálculo com regras vigentes a partir de {formatRulesVersion(result.rulesVersion)}.
        </p>
        <div className="mt-4">
          <ResultActions />
        </div>
      </div>
    </div>
  );
}
