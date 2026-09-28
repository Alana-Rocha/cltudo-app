'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { formatBrDate, maskBrDateInput, parseBrDate } from '@/lib/dates';
import { DatePicker } from './DatePicker';

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
};

const POPOVER_WIDTH = 304; // w-[19rem]

export function DateInput({ id, label, value, onChange, hint, error }: Props) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  function toggle() {
    if (!open) {
      const rect = rootRef.current?.getBoundingClientRect();
      setAlignRight(!!rect && rect.left + POPOVER_WIDTH > window.innerWidth - 16);
    }
    setOpen((o) => !o);
  }

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  const describedBy = [error ? `${id}-error` : '', hint ? `${id}-hint` : ''].filter(Boolean).join(' ') || undefined;

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <div className="flex items-center rounded-md border focus-within:ring-2 focus-within:ring-brand-500">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          placeholder="dd/mm/aaaa"
          maxLength={10}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(maskBrDateInput(e.target.value))}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className="w-full min-w-0 border-0 bg-transparent px-3 py-2 tabular-nums focus:outline-none"
        />
        <button
          ref={triggerRef}
          type="button"
          onClick={toggle}
          aria-label={`Abrir calendário: ${label}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-brand-700"
        >
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {open && (
        <div className={`absolute top-full z-30 mt-1 ${alignRight ? 'right-0' : 'left-0'}`}>
          <DatePicker selected={parseBrDate(value)} onSelect={(date) => onChange(formatBrDate(date))} onClose={close} />
        </div>
      )}
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-gray-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
