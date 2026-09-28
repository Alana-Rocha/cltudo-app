'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export type SelectOption<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  id: string;
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  hint?: string;
};

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Seleção com o visual do app (a lista nativa do <select> não segue o tema).
 * Segue o padrão "select-only combobox" do WAI-ARIA: setas, Home/End,
 * Enter/Espaço, Esc e busca pela primeira letra.
 */
export function Select<T extends string>({ id, label, value, onChange, options, hint }: Props<T>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const typeahead = useRef({ text: '', at: 0 });
  const listboxId = `${id}-listbox`;
  const labelId = `${id}-label`;
  const optionId = (i: number) => `${id}-option-${i}`;
  const hintId = useId();

  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) document.getElementById(optionId(active))?.scrollIntoView?.({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active]);

  function openList(index = selectedIndex) {
    setActive(index);
    setOpen(true);
  }

  function choose(index: number) {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
  }

  function jumpByTyping(key: string) {
    const now = Date.now();
    typeahead.current.text = now - typeahead.current.at > 700 ? key : typeahead.current.text + key;
    typeahead.current.at = now;
    const query = normalize(typeahead.current.text);
    const start = open ? active + 1 : selectedIndex + 1;
    const ordered = [...options.slice(start), ...options.slice(0, start)];
    const match = ordered.find((o) => normalize(o.label).startsWith(query));
    if (!match) return;
    const index = options.indexOf(match);
    if (open) setActive(index);
    else onChange(match.value);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const last = options.length - 1;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openList();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        jumpByTyping(e.key);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive((i) => Math.min(last, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        e.preventDefault();
        setActive(0);
        break;
      case 'End':
        e.preventDefault();
        setActive(last);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        choose(active);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      case 'Tab':
        choose(active);
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) jumpByTyping(e.key);
    }
  }

  return (
    <div ref={rootRef}>
      <label id={labelId} htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <button
          id={id}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-labelledby={labelId}
          aria-describedby={hint ? hintId : undefined}
          aria-activedescendant={open ? optionId(active) : undefined}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={onKeyDown}
          className="flex w-full items-center justify-between gap-2 rounded-md border bg-white px-3 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <span className="truncate">{selected?.label}</span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
        {open && (
          <ul
            id={listboxId}
            role="listbox"
            aria-labelledby={labelId}
            tabIndex={-1}
            className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border bg-white py-1 shadow-lg"
          >
            {options.map((option, i) => {
              const isSelected = option.value === value;
              return (
                <li
                  key={option.value}
                  id={optionId(i)}
                  role="option"
                  aria-selected={isSelected}
                  onPointerEnter={() => setActive(i)}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => choose(i)}
                  className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm ${
                    i === active ? 'bg-brand-50 text-brand-700' : ''
                  } ${isSelected ? 'font-medium' : ''}`}
                >
                  {option.label}
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-gray-400">
          {hint}
        </p>
      )}
    </div>
  );
}
