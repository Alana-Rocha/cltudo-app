import type { Cents } from '@/lib/money';

export type LineItem = {
  key: string;
  label: string;
  amount: Cents;
  type: 'earning' | 'deduction' | 'info';
  explanation: string;
  legalBasis?: string;
  /** Section heading in the result; defaults to one derived from `type`. */
  group?: string;
};

export type Step = {
  label: string;
  formula: string;
  value: Cents;
  /** Unit for displaying `value`. Defaults to 'currency' (cents formatted as BRL). */
  unit?: 'currency' | 'days' | 'hours';
};

export type CalculationResult = {
  items: LineItem[];
  totals: { gross: Cents; deductions: Cents; net: Cents };
  steps: Step[];
  included: string[];
  excluded: string[];
  warnings: string[];
  rulesVersion: string;
};
