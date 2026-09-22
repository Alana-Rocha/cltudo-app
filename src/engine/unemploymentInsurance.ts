import type { RuleSet } from '@/rules/schema';
import { add, clampToZero, divide, multiply, subtract, max as maxCents, min as minCents, type Cents } from '@/lib/money';
import type { CalculationResult } from './types';

export type UnemploymentInsuranceInput = {
  lastThreeSalaries: [Cents, Cents, Cents] | [Cents, Cents] | [Cents];
  requestNumber: number; // 1ª, 2ª, 3ª+ solicitação
  monthsWorkedInPeriod: number; // conforme a regra de carência de cada solicitação
};

/**
 * Seguro-desemprego (Lei 7.998/1990). VERIFY: valores de faixa e teto de
 * 2026 vêm de fontes secundárias convergentes (não confirmados em fonte
 * primária do MTE nesta pesquisa) — ver rules/2026-01.ts.
 */
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
    tierLabel = `Faixa 1: ${(table.tier1Rate * 100).toFixed(0)}% da média`;
  } else if (average <= table.tier2UpTo) {
    const excess = subtract(average, table.tier1UpTo);
    rawInstallment = add(table.tier2Base, multiply(excess, table.tier2Rate));
    tierLabel = `Faixa 2: ${(table.tier2Base / 100).toFixed(2)} + ${(table.tier2Rate * 100).toFixed(0)}% do excedente`;
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
      { key: 'total', label: `Total (${numberOfInstallments} parcelas)`, amount: multiply(installment, numberOfInstallments), type: 'earning', explanation: `${(installment / 100).toFixed(2)} × ${numberOfInstallments}` },
    ],
    totals: { gross: multiply(installment, numberOfInstallments), deductions: 0, net: multiply(installment, numberOfInstallments) },
    steps: [{ label: 'Parcela', formula: tierLabel, value: installment }],
    included: [],
    excluded: numberOfInstallments === 0 ? ['Tempo trabalhado informado não atinge a carência mínima para nenhuma faixa de parcelas nesta solicitação.'] : [],
    warnings: [
      'Valores de faixa e teto de 2026 não confirmados em fonte primária do Ministério do Trabalho e Emprego — confirme antes de decidir com base neste valor.',
    ],
    rulesVersion: rules.id,
  };
}
