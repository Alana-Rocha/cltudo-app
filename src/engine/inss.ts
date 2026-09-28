import type { RuleSet } from '@/rules/schema';
import { add, clampToZero, min, multiply, subtract, type Cents } from '@/lib/money';
import type { Step } from './types';
import { formatDecimal, formatPercent } from '@/lib/format';

export type InssBracketBreakdown = {
  rate: number;
  base: Cents; // portion of the salary that fell inside this bracket
  amount: Cents; // contribution due on that portion
};

export type InssResult = {
  total: Cents;
  cappedBase: Cents; // base actually used, after applying the ceiling
  brackets: InssBracketBreakdown[];
  nominalRate: number; // rate of the last (highest) bracket reached
  effectiveRate: number; // total / cappedBase (0 if cappedBase is 0)
  steps: Step[];
};

/**
 * Calculates the employee's INSS contribution, progressively by bracket,
 * capped at the contribution ceiling (rules 3.1). `base` is the taxable
 * salary in cents (already excluding any non-incidence amounts, e.g. the
 * 13º is calculated separately by calling this again with the 13º as base).
 */
export function calculateInss(base: Cents, rules: RuleSet): InssResult {
  const cappedBase = min(base, rules.inss.ceiling);

  const brackets: InssBracketBreakdown[] = [];
  let previousUpTo = 0;
  let total = 0;

  for (const bracket of rules.inss.brackets) {
    const bracketUpper = bracket.upTo === null ? cappedBase : Math.min(bracket.upTo, cappedBase);
    const bracketBase = clampToZero(subtract(bracketUpper, previousUpTo));
    if (bracketBase > 0) {
      const amount = multiply(bracketBase, bracket.rate);
      brackets.push({ rate: bracket.rate, base: bracketBase, amount });
      total = add(total, amount);
    }
    previousUpTo = bracket.upTo === null ? cappedBase : bracket.upTo;
    if (previousUpTo >= cappedBase) break;
  }

  const lastBracket = brackets[brackets.length - 1];
  const nominalRate = lastBracket ? lastBracket.rate : 0;
  const effectiveRate = cappedBase > 0 ? total / cappedBase : 0;

  const steps: Step[] = brackets.map((b, i) => ({
    label: `INSS — faixa ${i + 1} (${formatPercent(b.rate, 1)})`,
    formula: `${formatDecimal(b.base / 100, 2)} × ${formatPercent(b.rate, 1)}`,
    value: b.amount,
  }));
  steps.push({
    label: 'INSS — total',
    formula: brackets.map((b) => formatDecimal(b.amount / 100, 2)).join(' + '),
    value: total,
  });

  return { total, cappedBase, brackets, nominalRate, effectiveRate, steps };
}

/**
 * Standalone entry point for the INSS calculator page (Fase 3): wraps
 * calculateInss into the standard CalculationResult contract.
 */
export function calculateInssStandalone(base: Cents, rules: RuleSet): import('./types').CalculationResult {
  const result = calculateInss(base, rules);
  return {
    items: [
      ...result.brackets.map((b, i) => ({
        key: `bracket-${i}`,
        label: `Faixa ${i + 1} (${formatPercent(b.rate, 1)})`,
        amount: b.amount,
        type: 'deduction' as const,
        explanation: `${formatDecimal(b.base / 100, 2)} × ${formatPercent(b.rate, 1)}`,
      })),
      {
        key: 'effective-rate',
        label: 'Alíquota efetiva',
        amount: 0,
        type: 'info' as const,
        explanation: `${formatPercent(result.effectiveRate, 2)} do salário (alíquota nominal da última faixa: ${formatPercent(result.nominalRate, 1)})`,
      },
    ],
    totals: { gross: base, deductions: result.total, net: base - result.total },
    steps: result.steps,
    included: [],
    excluded: [],
    warnings: base > rules.inss.ceiling ? [`Valor acima do teto de contribuição (${formatDecimal(rules.inss.ceiling / 100, 2)}) não sofre desconto adicional.`] : [],
    rulesVersion: rules.id,
  };
}
