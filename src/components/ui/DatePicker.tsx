'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { daysInMonth } from '@/lib/dates';

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const WEEKDAYS = [
  { short: 'D', long: 'domingo' },
  { short: 'S', long: 'segunda-feira' },
  { short: 'T', long: 'terça-feira' },
  { short: 'Q', long: 'quarta-feira' },
  { short: 'Q', long: 'quinta-feira' },
  { short: 'S', long: 'sexta-feira' },
  { short: 'S', long: 'sábado' },
];
const YEARS_PER_PAGE = 12;

type View = 'days' | 'months' | 'years';

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));
const sameDay = (a: Date | null, b: Date) => !!a && a.getTime() === b.getTime();
const key = (d: Date) => d.toISOString().slice(0, 10);

function todayUtc(): Date {
  const now = new Date();
  return utc(now.getFullYear(), now.getMonth(), now.getDate());
}

function addDays(d: Date, n: number): Date {
  return utc(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n);
}

/** Soma meses mantendo o dia, limitado ao último dia do mês de destino (31/01 + 1 mês = 28 ou 29/02). */
function addMonths(d: Date, n: number): Date {
  const target = utc(d.getUTCFullYear(), d.getUTCMonth() + n, 1);
  const day = Math.min(d.getUTCDate(), daysInMonth(target.getUTCFullYear(), target.getUTCMonth()));
  return utc(target.getUTCFullYear(), target.getUTCMonth(), day);
}

function formatLong(d: Date): string {
  return `${WEEKDAYS[d.getUTCDay()]?.long}, ${d.getUTCDate()} de ${MONTHS[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

type Props = {
  selected: Date | null;
  onSelect: (date: Date) => void;
  onClose: () => void;
};

/** Calendário no padrão "date picker dialog" do WAI-ARIA. */
export function DatePicker({ selected, onSelect, onClose }: Props) {
  const today = todayUtc();
  const [focused, setFocused] = useState<Date>(selected ?? today);
  const [view, setView] = useState<View>('days');
  const gridRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const year = focused.getUTCFullYear();
  const month = focused.getUTCMonth();

  useEffect(() => {
    gridRef.current?.querySelector<HTMLButtonElement>('[data-focus="true"]')?.focus();
  }, [focused, view]);

  function pick(date: Date) {
    onSelect(date);
    onClose();
  }

  function onDayKeyDown(e: React.KeyboardEvent) {
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      Home: () => addDays(focused, -focused.getUTCDay()),
      End: () => addDays(focused, 6 - focused.getUTCDay()),
      PageUp: () => addMonths(focused, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focused, e.shiftKey ? 12 : 1),
    };
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      setFocused(move());
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      if (view === 'days') onClose();
      else setView('days');
    }
  }

  function step(direction: 1 | -1) {
    if (view === 'days') setFocused(addMonths(focused, direction));
    else if (view === 'months') setFocused(addMonths(focused, direction * 12));
    else setFocused(addMonths(focused, direction * 12 * YEARS_PER_PAGE));
  }

  const rawTitle =
    view === 'days'
      ? `${MONTHS[month]} de ${year}`
      : view === 'months'
        ? String(year)
        : `${year - (year % YEARS_PER_PAGE)} – ${year - (year % YEARS_PER_PAGE) + YEARS_PER_PAGE - 1}`;
  const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
  const prevLabel = { days: 'Mês anterior', months: 'Ano anterior', years: 'Anos anteriores' }[view];
  const nextLabel = { days: 'Próximo mês', months: 'Próximo ano', years: 'Próximos anos' }[view];

  const firstOfMonth = utc(year, month, 1);
  const gridStart = addDays(firstOfMonth, -firstOfMonth.getUTCDay());
  const weeks = Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(gridStart, w * 7 + d)));

  const navButton =
    'flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-900';
  const cellButton = 'rounded-md text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500';

  return (
    <div role="dialog" aria-modal="false" aria-labelledby={titleId} onKeyDown={onKeyDown} className="w-[19rem] rounded-xl border bg-white p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between gap-1">
        <button type="button" onClick={() => step(-1)} aria-label={prevLabel} className={navButton}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          id={titleId}
          onClick={() => setView(view === 'days' ? 'years' : view === 'years' ? 'months' : 'days')}
          aria-live="polite"
          className="rounded-md px-2 py-1 text-sm font-semibold transition hover:bg-gray-100"
        >
          {title}
        </button>
        <button type="button" onClick={() => step(1)} aria-label={nextLabel} className={navButton}>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div ref={gridRef}>
        {view === 'days' && (
          <table role="grid" aria-labelledby={titleId} className="w-full table-fixed border-collapse" onKeyDown={onDayKeyDown}>
            <thead>
              <tr>
                {WEEKDAYS.map((w) => (
                  <th key={w.long} scope="col" abbr={w.long} className="pb-1 text-center text-xs font-medium text-gray-400">
                    {w.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week) => (
                <tr key={key(week[0]!)}>
                  {week.map((day) => {
                    const inMonth = day.getUTCMonth() === month;
                    const isSelected = sameDay(selected, day);
                    const isFocused = sameDay(focused, day);
                    const isToday = sameDay(today, day);
                    return (
                      <td key={key(day)} role="gridcell" aria-selected={isSelected} className="p-0.5 text-center">
                        <button
                          type="button"
                          tabIndex={isFocused ? 0 : -1}
                          data-focus={isFocused}
                          aria-label={formatLong(day)}
                          aria-current={isToday ? 'date' : undefined}
                          onClick={() => pick(day)}
                          className={`${cellButton} mx-auto block h-9 w-9 tabular-nums ${
                            isSelected
                              ? 'bg-brand-600 font-semibold text-white hover:bg-brand-700'
                              : isToday
                                ? 'relative font-semibold text-brand-700 hover:bg-brand-50 after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-brand-500'
                                : inMonth
                                  ? 'hover:bg-gray-100'
                                  : 'text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          {day.getUTCDate()}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {view === 'years' && (
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: YEARS_PER_PAGE }, (_, i) => year - (year % YEARS_PER_PAGE) + i).map((y) => (
              <button
                key={y}
                type="button"
                data-focus={y === year}
                onClick={() => {
                  setFocused(addMonths(focused, (y - year) * 12));
                  setView('months');
                }}
                className={`${cellButton} py-2.5 tabular-nums ${y === year ? 'bg-brand-600 font-semibold text-white' : 'hover:bg-gray-100'} ${
                  y === today.getUTCFullYear() && y !== year ? 'text-brand-700' : ''
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        )}

        {view === 'months' && (
          <div className="grid grid-cols-3 gap-1">
            {MONTHS.map((name, m) => (
              <button
                key={name}
                type="button"
                data-focus={m === month}
                onClick={() => {
                  setFocused(addMonths(focused, m - month));
                  setView('days');
                }}
                className={`${cellButton} py-2.5 capitalize ${m === month ? 'bg-brand-600 font-semibold text-white' : 'hover:bg-gray-100'}`}
              >
                {name.slice(0, 3)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-between border-t pt-2">
        <button type="button" onClick={() => pick(today)} className="rounded-md px-2 py-1 text-sm font-medium text-brand-700 transition hover:bg-brand-50">
          Hoje
        </button>
        <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-sm text-gray-500 transition hover:bg-gray-100">
          Fechar
        </button>
      </div>
    </div>
  );
}
