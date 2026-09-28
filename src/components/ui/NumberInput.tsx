'use client';

import { Minus, Plus } from 'lucide-react';

type Props = {
  id: string;
  label: string;
  /** Com ponto decimal (ex.: "10.5"); na tela aparece com vírgula. */
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  hint?: string;
  error?: string;
  decimal?: boolean;
  negative?: boolean;
};

function sanitize(raw: string, decimal: boolean, negative: boolean): string {
  let text = raw.replace(/\./g, ',');
  const minus = negative && text.trimStart().startsWith('-');
  text = text.replace(decimal ? /[^\d,]/g : /\D/g, '');
  if (decimal) {
    const [whole, ...rest] = text.split(',');
    text = rest.length ? `${whole},${rest.join('')}` : (whole ?? '');
  }
  return (minus ? '-' : '') + text.replace(',', '.');
}

export function NumberInput({ id, label, value, onChange, min, max, hint, error, decimal = false, negative = false }: Props) {
  const numeric = value === '' || value === '-' ? null : Number(value);
  const rangeError =
    numeric === null || Number.isNaN(numeric)
      ? undefined
      : max !== undefined && numeric > max
        ? `Use no máximo ${max}.`
        : min !== undefined && numeric < min
          ? `Use no mínimo ${min}.`
          : undefined;
  const message = error ?? rangeError;

  function step(delta: number) {
    const base = numeric === null || Number.isNaN(numeric) ? (min ?? 0) - delta : numeric;
    let next = Math.round((base + delta) * 100) / 100;
    if (max !== undefined) next = Math.min(max, next);
    if (min !== undefined) next = Math.max(min, next);
    onChange(String(next));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      step(1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      step(-1);
    }
  }

  const stepButton =
    'flex w-10 shrink-0 items-center justify-center text-gray-500 transition hover:text-brand-700 disabled:opacity-40 disabled:hover:text-gray-500';

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <div className="flex items-stretch overflow-hidden rounded-md border focus-within:ring-2 focus-within:ring-brand-500">
        <button
          type="button"
          tabIndex={-1}
          aria-label="Diminuir"
          aria-controls={id}
          onClick={() => step(-1)}
          disabled={min !== undefined && numeric !== null && numeric <= min}
          className={`${stepButton} border-r`}
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <input
          id={id}
          type="text"
          inputMode={decimal ? 'decimal' : 'numeric'}
          role="spinbutton"
          aria-valuenow={numeric ?? undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          autoComplete="off"
          value={value.replace('.', ',')}
          onChange={(e) => onChange(sanitize(e.target.value, decimal, negative))}
          onKeyDown={onKeyDown}
          aria-invalid={!!message}
          aria-describedby={message ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className="w-full min-w-0 border-0 bg-transparent px-3 py-2 text-center tabular-nums focus:outline-none"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Aumentar"
          aria-controls={id}
          onClick={() => step(1)}
          disabled={max !== undefined && numeric !== null && numeric >= max}
          className={`${stepButton} border-l`}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-gray-400">
          {hint}
        </p>
      )}
      {message && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {message}
        </p>
      )}
    </div>
  );
}
