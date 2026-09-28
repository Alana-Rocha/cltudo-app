import type { RuleSet } from '@/rules/schema';
import { multiply, type Cents } from '@/lib/money';
import type { CalculationResult } from './types';
import { formatDecimal, formatPercent } from '@/lib/format';

export type UnhealthinessGrade = 'low' | 'medium' | 'high';

export type UnhealthinessInput = {
  grade: UnhealthinessGrade;
  /** Base para o cálculo. Se omitida, usa o salário mínimo (regra geral — Súmula Vinculante 4/STF). */
  base?: Cents;
};

const GRADE_LABEL: Record<UnhealthinessGrade, string> = { low: 'mínimo (10%)', medium: 'médio (20%)', high: 'máximo (40%)' };

/**
 * Adicional de insalubridade (CLT art. 192). A base "correta" é
 * historicamente controversa: a regra geral (Súmula Vinculante 4/STF) é o
 * salário mínimo, salvo lei ou norma coletiva que fixe base diferente —
 * sinalizado como aviso.
 */
export function calculateUnhealthiness(input: UnhealthinessInput, rules: RuleSet): CalculationResult {
  const base = input.base ?? rules.minimumWage;
  const rate = rules.unhealthiness.rates[input.grade];
  const amount = multiply(base, rate);

  return {
    items: [
      { key: 'unhealthiness', label: `Adicional de insalubridade — grau ${GRADE_LABEL[input.grade]}`, amount, type: 'earning', explanation: `${formatDecimal(base / 100, 2)} × ${formatPercent(rate, 0)}`, legalBasis: 'CLT art. 192' },
    ],
    totals: { gross: amount, deductions: 0, net: amount },
    steps: [{ label: 'Adicional de insalubridade', formula: `${formatDecimal(base / 100, 2)} × ${formatPercent(rate, 0)}`, value: amount }],
    included: [],
    excluded: [],
    warnings: input.base
      ? []
      : [
          'Calculado sobre o salário mínimo (regra geral, Súmula Vinculante 4/STF). Se sua lei, convenção ou acordo coletivo fixar outra base (ex.: o salário base), informe-a.',
        ],
    rulesVersion: rules.id,
  };
}
