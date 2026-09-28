import type { RuleSet } from '@/rules/schema';
import { multiply, type Cents } from '@/lib/money';
import type { CalculationResult } from './types';
import { formatDecimal, formatPercent } from '@/lib/format';

export type HazardPayInput = {
  baseSalary: Cents; // salário base, sem gratificações, prêmios ou outras verbas
};

/** Adicional de periculosidade (CLT art. 193, §1º): 30% sobre o salário base. */
export function calculateHazardPay(input: HazardPayInput, rules: RuleSet): CalculationResult {
  const amount = multiply(input.baseSalary, rules.hazardPay.rate);

  return {
    items: [
      { key: 'hazard', label: `Adicional de periculosidade (${formatPercent(rules.hazardPay.rate, 0)})`, amount, type: 'earning', explanation: `${formatDecimal(input.baseSalary / 100, 2)} × ${formatPercent(rules.hazardPay.rate, 0)}, sem gratificações`, legalBasis: 'CLT art. 193, §1º' },
    ],
    totals: { gross: amount, deductions: 0, net: amount },
    steps: [{ label: 'Adicional de periculosidade', formula: `${formatDecimal(input.baseSalary / 100, 2)} × ${formatPercent(rules.hazardPay.rate, 0)}`, value: amount }],
    included: [],
    excluded: [],
    warnings: ['Insalubridade e periculosidade não são cumuláveis: o trabalhador escolhe o mais vantajoso (CLT art. 193, §2º).'],
    rulesVersion: rules.id,
  };
}
