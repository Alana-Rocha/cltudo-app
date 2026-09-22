import type { RuleSet } from '@/rules/schema';
import { add, clampToZero, divide, multiply, subtract, type Cents } from '@/lib/money';
import { calculateInss } from './inss';
import { calculateIrrf } from './irrf';
import type { CalculationResult } from './types';

export type ThirteenthInput = {
  grossSalary: Cents;
  monthsWorked: number; // 0..12, avos already resolved by the caller (dates.countAvos)
  averageVariables?: Cents; // média de comissões/HE habituais, opcional
  dependents: number;
  firstInstallmentPaid?: Cents; // if simulating the 2nd installment only
};

export function calculateThirteenth(input: ThirteenthInput, rules: RuleSet): CalculationResult {
  if (input.monthsWorked < 0 || input.monthsWorked > 12) {
    throw new Error('monthsWorked must be between 0 and 12');
  }

  const monthlyBase = add(input.grossSalary, input.averageVariables ?? 0);
  const fullAmount = divide(multiply(monthlyBase, input.monthsWorked), 12);

  const firstInstallment =
    input.firstInstallmentPaid ?? multiply(fullAmount, rules.thirteenth.firstInstallmentRate);

  const inss = calculateInss(fullAmount, rules);
  const irrf = calculateIrrf(
    { taxableIncome: fullAmount, inss: inss.total, dependents: input.dependents },
    rules
  );

  const secondInstallment = clampToZero(
    subtract(fullAmount, add(inss.total, irrf.total, firstInstallment))
  );

  return {
    items: [
      { key: 'full', label: '13º integral', amount: fullAmount, type: 'earning', explanation: `${(monthlyBase / 100).toFixed(2)} ÷ 12 × ${input.monthsWorked} avos` },
      { key: 'first', label: '1ª parcela (até 30/11)', amount: firstInstallment, type: 'earning', explanation: '50% do integral, sem descontos' },
      { key: 'inss', label: 'INSS sobre o 13º', amount: inss.total, type: 'deduction', explanation: 'Sobre o 13º integral, separado do salário' },
      { key: 'irrf', label: 'IRRF sobre o 13º', amount: irrf.total, type: 'deduction', explanation: 'Sobre o 13º integral, tributação exclusiva' },
      { key: 'second', label: '2ª parcela (até 20/12)', amount: secondInstallment, type: 'earning', explanation: 'Integral − INSS − IRRF − 1ª parcela' },
    ],
    totals: { gross: fullAmount, deductions: add(inss.total, irrf.total), net: add(firstInstallment, secondInstallment) },
    steps: [...inss.steps, ...irrf.steps],
    included: [],
    excluded: [],
    warnings: [],
    rulesVersion: rules.id,
  };
}
