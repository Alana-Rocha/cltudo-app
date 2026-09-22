/**
 * All monetary values in this codebase are integer cents (BRL centavos).
 * Never use floating point for money outside this module's rounding boundary.
 */

export type Cents = number;

/** Converts a BRL amount typed by the user (e.g. 3000.5) into integer cents. */
export function toCents(reais: number): Cents {
  return Math.round(reais * 100);
}

/** Converts integer cents back to a BRL float, only for display formatting. */
export function toReais(cents: Cents): number {
  return cents / 100;
}

export function add(...values: Cents[]): Cents {
  return values.reduce((sum, v) => sum + v, 0);
}

export function subtract(a: Cents, b: Cents): Cents {
  return a - b;
}

/**
 * Multiplies cents by a rate (0..1) or a plain factor, rounding to the
 * nearest cent (banker's rounding is not required by CLT payroll practice;
 * standard "round half up" is used and documented here).
 */
export function multiply(cents: Cents, factor: number): Cents {
  return Math.round(cents * factor);
}

/** Divides cents by an integer divisor, rounding to the nearest cent. */
export function divide(cents: Cents, divisor: number): Cents {
  if (divisor === 0) throw new Error('Division by zero in money.divide');
  return Math.round(cents / divisor);
}

export function isNegative(cents: Cents): boolean {
  return cents < 0;
}

/** Clamps a value to zero if it would otherwise go negative (e.g. IRRF base). */
export function clampToZero(cents: Cents): Cents {
  return cents < 0 ? 0 : cents;
}

export function min(...values: Cents[]): Cents {
  return Math.min(...values);
}

export function max(...values: Cents[]): Cents {
  return Math.max(...values);
}

/**
 * Masks free-typed digits into a BRL amount string (e.g. "1.234,56"),
 * treating the digits as cents — the common "digitação de centavos" UX.
 */
export function maskBrCurrencyInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (!digits) return '';
  const cents = Number(digits);
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
