import type { RuleSet } from '@/rules/schema';
import { divide, multiply, subtract, type Cents } from '@/lib/money';
import { calculateInss } from './inss';
import { calculateIrrf } from './irrf';
import type { CalculationResult } from './types';

export type ProportionalSalaryInput = {
  grossSalary: Cents; // salário mensal integral
  daysWorked: number; // 1..30, dias trabalhados no mês (admissão ou desligamento no meio do mês)
  dependents: number;
};

/** Salário proporcional a um mês incompleto (admissão ou saída no meio do mês). */
export function calculateProportionalSalary(input: ProportionalSalaryInput, rules: RuleSet): CalculationResult {
  const dailyRate = divide(input.grossSalary, 30);
  const proportionalGross = multiply(dailyRate, input.daysWorked);

  const inss = calculateInss(proportionalGross, rules);
  const irrf = calculateIrrf({ taxableIncome: proportionalGross, inss: inss.total, dependents: input.dependents }, rules);
  const net = subtract(proportionalGross, inss.total + irrf.total);

  return {
    items: [
      { key: 'proportional', label: `Salário proporcional (${input.daysWorked} dias)`, amount: proportionalGross, type: 'earning', explanation: `${(input.grossSalary / 100).toFixed(2)} ÷ 30 × ${input.daysWorked}` },
      { key: 'inss', label: 'INSS', amount: inss.total, type: 'deduction', explanation: `Alíquota efetiva ${(inss.effectiveRate * 100).toFixed(2)}%` },
      { key: 'irrf', label: 'IRRF', amount: irrf.total, type: 'deduction', explanation: irrf.usedSimplifiedDiscount ? 'Desconto simplificado' : 'Deduções legais' },
    ],
    totals: { gross: proportionalGross, deductions: inss.total + irrf.total, net },
    steps: [...inss.steps, ...irrf.steps],
    included: [],
    excluded: [],
    warnings: [],
    rulesVersion: rules.id,
  };
}
