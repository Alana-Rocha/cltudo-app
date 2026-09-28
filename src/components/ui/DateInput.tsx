'use client';

import { maskBrDateInput } from '@/lib/dates';

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
};

export function DateInput({ id, label, value, onChange, hint, error }: Props) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        maxLength={10}
        value={value}
        onChange={(e) => onChange(maskBrDateInput(e.target.value))}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
