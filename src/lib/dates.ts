/** Adds N days to a date, returning a new Date (UTC-safe, no mutation). */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/** Whole years between two dates (used for aviso prévio's +3 days/year). */
export function fullYearsBetween(start: Date, end: Date): number {
  let years = end.getUTCFullYear() - start.getUTCFullYear();
  const anniversaryThisYear = new Date(Date.UTC(end.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  if (end.getTime() < anniversaryThisYear.getTime()) years -= 1;
  return Math.max(0, years);
}

/**
 * Counts "avos" (twelfths) between two dates for 13º/férias proportional
 * calculations: one avo per calendar month with at least `minDaysForMonth`
 * days worked, capped at 12.
 */
export function countAvos(start: Date, end: Date, minDaysForMonth: number): number {
  if (end.getTime() < start.getTime()) return 0;

  let avos = 0;
  let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));

  while (cursor.getTime() <= end.getTime()) {
    const monthStart = new Date(
      Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1)
    );
    const monthEnd = new Date(
      Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0)
    );

    const periodStart = monthStart.getTime() < start.getTime() ? start : monthStart;
    const periodEnd = monthEnd.getTime() > end.getTime() ? end : monthEnd;

    const daysWorked =
      Math.floor((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (daysWorked >= minDaysForMonth) avos += 1;

    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
  }

  return Math.min(avos, 12);
}

/** Number of Sundays in a given month (0-indexed month, i.e. Jan = 0). */
export function countSundaysInMonth(year: number, month: number): number {
  let count = 0;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  for (let d = 1; d <= daysInMonth; d++) {
    if (new Date(Date.UTC(year, month, d)).getUTCDay() === 0) count++;
  }
  return count;
}

/**
 * Working days in a month, excluding Sundays and a caller-supplied list of
 * holiday day-numbers. Saturdays are treated as working days here (common
 * payroll convention); adjust per-calculator if a 5-day week applies.
 */
export function countWorkingDaysInMonth(
  year: number,
  month: number,
  holidays: number[] = []
): number {
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const isSunday = new Date(Date.UTC(year, month, d)).getUTCDay() === 0;
    if (!isSunday && !holidays.includes(d)) count++;
  }
  return count;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** Parses a dd/mm/aaaa string into a UTC Date, or null if invalid. */
export function parseBrDate(input: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input.trim());
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const date = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
  const valid =
    date.getUTCFullYear() === Number(yyyy) &&
    date.getUTCMonth() === Number(mm) - 1 &&
    date.getUTCDate() === Number(dd);
  return valid ? date : null;
}

/** Masks free-typed digits into a dd/mm/aaaa string, inserting "/" as the user types. */
export function maskBrDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
  return parts.join('/');
}

export function formatBrDate(date: Date): string {
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = date.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
