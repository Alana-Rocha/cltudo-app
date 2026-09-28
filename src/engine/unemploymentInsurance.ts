import type { RuleSet } from '@/rules/schema';
import { add, clampToZero, divide, multiply, subtract, max as maxCents, min as minCents, type Cents } from '@/lib/money';
import type { CalculationResult } from './types';
import { formatDecimal, formatPercent } from '@/lib/format';

export type UnemploymentInsuranceInput = {
  lastThreeSalaries: [Cents, Cents, Cents] | [Cents, Cents] | [Cents];
  requestNumber: number; // 1ª, 2ª, 3ª+ solicitação
  monthsWorkedInPeriod: number; // conforme a regra de carência de cada solicitação
};

/** Seguro-desemprego (Lei 7.998/1990). */
export function calculateUnemploymentInsurance(
  input: UnemploymentInsuranceInput,
  rules: RuleSet
): CalculationResult {
  const average = divide(
    input.lastThreeSalaries.reduce((sum, s) => add(sum, s), 0),
    input.lastThreeSalaries.length
  );

  const table = rules.unemploymentInsurance;
  let rawInstallment: Cents;
  let tierLabel: string;

  if (average <= table.tier1UpTo) {
    rawInstallment = multiply(average, table.tier1Rate);
    tierLabel = `Faixa 1: ${formatPercent(table.tier1Rate, 0)} da média`;
  } else if (average <= table.tier2UpTo) {
    const excess = subtract(average, table.tier1UpTo);
    rawInstallment = add(table.tier2Base, multiply(excess, table.tier2Rate));
    tierLabel = `Faixa 2: ${formatDecimal(table.tier2Base / 100, 2)} + ${formatPercent(table.tier2Rate, 0)} do excedente`;
  } else {
    rawInstallment = table.ceiling;
    tierLabel = 'Faixa 3: valor fixo (teto)';
  }

  // A parcela nunca fica abaixo do salário mínimo nem acima do teto.
  const installment = clampToZero(maxCents(minCents(rawInstallment, table.ceiling), rules.minimumWage));

  const eligibleTiers = table.installmentsBySeniority
    .filter((t) => t.requestNumber === input.requestNumber && input.monthsWorkedInPeriod >= t.minMonths)
    .sort((a, b) => b.minMonths - a.minMonths);
  const numberOfInstallments = eligibleTiers[0]?.installments ?? 0;

  return {
    items: [
      { key: 'average', label: 'Média dos últimos 3 salários', amount: average, type: 'info', explanation: 'Base de cálculo' },
      { key: 'installment', label: 'Valor de cada parcela', amount: installment, type: 'earning', explanation: tierLabel, legalBasis: 'Lei 7.998/1990' },
      { key: 'total', label: `Total (${numberOfInstallments} parcelas)`, amount: multiply(installment, numberOfInstallments), type: 'earning', explanation: `${formatDecimal(installment / 100, 2)} × ${numberOfInstallments}` },
    ],
    totals: { gross: multiply(installment, numberOfInstallments), deductions: 0, net: multiply(installment, numberOfInstallments) },
    steps: [{ label: 'Parcela', formula: tierLabel, value: installment }],
    included: [],
    excluded: numberOfInstallments === 0 ? ['Tempo trabalhado informado não atinge a carência mínima para nenhuma faixa de parcelas nesta solicitação.'] : [],
    warnings: [],
    rulesVersion: rules.id,
  };
}
