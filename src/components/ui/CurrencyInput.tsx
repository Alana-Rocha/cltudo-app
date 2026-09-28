'use client';

import { maskBrCurrencyInput } from '@/lib/money';

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  hint?: string;
};

export function CurrencyInput({ id, label, value, onChange, required, error, hint }: Props) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      <div className="flex items-center rounded-md border px-3 focus-within:ring-2 focus-within:ring-brand-500">
        <span className="text-gray-400">R$</span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(maskBrCurrencyInput(e.target.value))}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="w-full border-0 bg-transparent px-2 py-2 focus:outline-none"
          placeholder="0,00"
        />
      </div>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
