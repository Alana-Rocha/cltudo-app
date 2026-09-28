'use client';

import { useEffect, useState } from 'react';
import { formatCurrency, formatDecimal } from '@/lib/format';
import type { CalculationResult, LineItem } from '@/engine/types';
import { ResultActions } from './ResultActions';
import { SponsoredOffer } from './SponsoredOffer';

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

const DEFAULT_GROUP: Record<LineItem['type'], string> = {
  earning: 'Proventos',
  deduction: 'Descontos',
  info: 'Resumo',
};

function groupItems(items: LineItem[]): { title: string; items: LineItem[] }[] {
  const groups: { title: string; items: LineItem[] }[] = [];
  for (const item of items) {
    const title = item.group ?? DEFAULT_GROUP[item.type];
    const existing = groups.find((g) => g.title === title);
    if (existing) existing.items.push(item);
    else groups.push({ title, items: [item] });
  }
  return groups;
}

function ItemAmount({ item }: { item: LineItem }) {
  if (item.type === 'info') {
    return item.amount !== 0 ? (
      <span className="shrink-0 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.amount)}</span>
    ) : null;
  }
  const negative = item.type === 'deduction' || item.amount < 0;
  return (
    <span className={`shrink-0 whitespace-nowrap font-medium tabular-nums ${negative ? 'text-red-600' : 'text-gray-900'}`}>
      {item.type === 'deduction' && item.amount >= 0 ? '− ' : ''}
      {formatCurrency(Math.abs(item.amount))}
    </span>
  );
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
  const groups = groupItems(result.items);

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
    <div className="card overflow-hidden">
      {isMonetary && (
        <div className="result-hero border-b px-6 py-7 text-center">
          <p className="text-sm font-medium text-gray-600">{headline.label}</p>
          <p className="mt-1 text-4xl font-bold tracking-tight text-brand-700 tabular-nums">{formatCurrency(headlineValue)}</p>
          {summary}
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {groups.map((group) => {
        const deductions = group.items.filter((i) => i.type === 'deduction');
        const subtotal = deductions.reduce((sum, i) => sum + Math.abs(i.amount), 0);
        return (
          <section key={group.title} className="border-b last:border-b-0">
            {groups.length > 1 && (
              <h3 className="px-6 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">{group.title}</h3>
            )}
            <ul className="divide-y">
              {group.items.map((item) => (
                <li key={item.key} className="flex items-center justify-between gap-4 px-6 py-3">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.explanation}</p>
                  </div>
                  <ItemAmount item={item} />
                </li>
              ))}
              {deductions.length > 1 && deductions.length === group.items.length && (
                <li className="flex items-center justify-between gap-4 bg-gray-50 px-6 py-2.5">
                  <p className="text-sm font-semibold">Total de descontos</p>
                  <span className="shrink-0 whitespace-nowrap font-semibold tabular-nums text-red-600">− {formatCurrency(subtotal)}</span>
                </li>
              )}
            </ul>
          </section>
        );
      })}

      {result.warnings.length > 0 && (
        <div className="space-y-1 border-t bg-amber-50 px-6 py-3 text-sm text-amber-800">
          {result.warnings.map((w, i) => (
            <p key={i}>{w}</p>
          ))}
        </div>
      )}

      {(result.included.length > 0 || result.excluded.length > 0) && (
        <div
          className={`grid gap-4 border-t p-6 ${result.included.length > 0 && result.excluded.length > 0 ? 'sm:grid-cols-2' : ''}`}
        >
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

      <SponsoredOffer />

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
                  <td className="py-2 pr-4">
                    <span className="block text-gray-600">{step.label}</span>
                    <span className="block font-mono text-xs text-gray-400">{step.formula}</span>
                  </td>
                  <td className="whitespace-nowrap py-2 text-right align-top font-medium tabular-nums">
                    {formatStepValue(step.value, step.unit)}
                  </td>
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
