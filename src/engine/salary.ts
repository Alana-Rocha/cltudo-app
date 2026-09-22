import type { RuleSet } from '@/rules/schema';
import { add, min, multiply, subtract, type Cents } from '@/lib/money';
import { calculateInss } from './inss';
import { calculateIrrf } from './irrf';
import type { CalculationResult } from './types';

export type SalaryInput = {
  grossSalary: Cents;
  dependents: number;
  alimony?: Cents;
  otherDeductions?: Cents;
  hasTransportVoucher?: boolean;
  transportVoucherValue?: Cents; // actual fare cost; capped at 6% of base salary
};

export function calculateSalary(input: SalaryInput, rules: RuleSet): CalculationResult {
  const inss = calculateInss(input.grossSalary, rules);
  const irrf = calculateIrrf(
    {
      taxableIncome: input.grossSalary,
      inss: inss.total,
      dependents: input.dependents,
      alimony: input.alimony,
      otherLegalDeductions: input.otherDeductions,
    },
    rules
  );

  const transportVoucherCap = multiply(input.grossSalary, rules.salary.transportVoucherMaxRate);
  const transportVoucherDiscount =
    input.hasTransportVoucher && input.transportVoucherValue
      ? min(input.transportVoucherValue, transportVoucherCap)
      : 0;

  const alimony = input.alimony ?? 0;
  const otherDeductions = input.otherDeductions ?? 0;

  const totalDeductions = add(inss.total, irrf.total, transportVoucherDiscount, alimony, otherDeductions);
  const net = subtract(input.grossSalary, totalDeductions);

  return {
    items: [
      { key: 'gross', label: 'Salário bruto', amount: input.grossSalary, type: 'earning', explanation: 'Valor informado' },
      {
        key: 'inss',
        label: 'INSS',
        amount: inss.total,
        type: 'deduction',
        explanation: `Alíquota efetiva ${(inss.effectiveRate * 100).toFixed(2)}%`,
        legalBasis: 'Lei 8.212/1991',
      },
      {
        key: 'irrf',
        label: 'IRRF',
        amount: irrf.total,
        type: 'deduction',
        explanation: irrf.usedSimplifiedDiscount ? 'Calculado com desconto simplificado' : 'Calculado com deduções legais',
        legalBasis: 'Lei 7.713/1988',
      },
      ...(transportVoucherDiscount > 0
        ? [{ key: 'vt', label: 'Vale-transporte', amount: transportVoucherDiscount, type: 'deduction' as const, explanation: 'Limitado a 6% do salário base' }]
        : []),
      ...(alimony > 0
        ? [{ key: 'alimony', label: 'Pensão alimentícia', amount: alimony, type: 'deduction' as const, explanation: 'Valor informado' }]
        : []),
      ...(otherDeductions > 0
        ? [{ key: 'other', label: 'Outros descontos', amount: otherDeductions, type: 'deduction' as const, explanation: 'Valor informado' }]
        : []),
    ],
    totals: { gross: input.grossSalary, deductions: totalDeductions, net },
    steps: [...inss.steps, ...irrf.steps],
    included: [],
    excluded: [],
    warnings: [],
    rulesVersion: rules.id,
  };
}
