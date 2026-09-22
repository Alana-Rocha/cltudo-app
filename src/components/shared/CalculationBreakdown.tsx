'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/format';
import type { CalculationResult } from '@/engine/types';

function formatStepValue(value: number, unit: 'currency' | 'days' | 'hours' | undefined): string {
  if (unit === 'days') return `${value} dia${value === 1 ? '' : 's'}`;
  if (unit === 'hours') return `${(value / 100).toFixed(2)}h`;
  return formatCurrency(value);
}

export function CalculationBreakdown({ result }: { result: CalculationResult }) {
  const [open, setOpen] = useState(false);
  const isMonetary = result.totals.gross !== 0 || result.totals.deductions !== 0 || result.totals.net !== 0;

  return (
    <div className="mt-6 rounded-lg border bg-white">
      {isMonetary && (
        <div className="border-b p-6 text-center">
          <p className="text-sm text-gray-500">Valor líquido</p>
          <p className="text-3xl font-bold text-brand-700">{formatCurrency(result.totals.net)}</p>
        </div>
      )}

      <ul className="divide-y" aria-live="polite">
        {result.items.map((item) => (
          <li key={item.key} className="flex items-center justify-between px-6 py-3">
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-gray-500">{item.explanation}</p>
            </div>
            {item.type !== 'info' && (
              <span
                className={
                  item.type === 'deduction' || item.amount < 0
                    ? 'font-medium text-red-600'
                    : 'font-medium text-gray-900'
                }
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
          className="text-sm font-medium text-brand-700 underline"
        >
          Como chegamos a esse valor?
        </button>
        {open && (
          <table className="mt-4 w-full text-sm">
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
          Cálculo com regras vigentes a partir de {result.rulesVersion}.
        </p>
      </div>
    </div>
  );
}
