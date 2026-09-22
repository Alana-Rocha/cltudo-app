import type { RuleSet } from '@/rules/schema';
import { divide, multiply, type Cents } from '@/lib/money';
import type { CalculationResult } from './types';

export type DsrInput = {
  variableAmount: Cents; // comissões, horas extras, etc. recebidas no mês
  workingDaysInMonth: number;
  sundaysAndHolidaysInMonth: number;
};

/**
 * DSR (Descanso Semanal Remunerado) sobre remuneração variável (Lei
 * 605/1949). Para horas extras, prefira engine/overtime.ts, que já inclui o
 * DSR sobre o total calculado — esta calculadora é para quando a pessoa já
 * sabe o total de variáveis recebidas no mês (comissões, por exemplo).
 */
export function calculateDsr(input: DsrInput, rules: RuleSet): CalculationResult {
  const dsr =
    input.workingDaysInMonth > 0
      ? multiply(divide(input.variableAmount, input.workingDaysInMonth), input.sundaysAndHolidaysInMonth)
      : 0;

  return {
    items: [
      { key: 'variable', label: 'Remuneração variável no mês', amount: input.variableAmount, type: 'earning', explanation: 'Valor informado' },
      { key: 'dsr', label: 'DSR sobre a remuneração variável', amount: dsr, type: 'earning', explanation: `(${(input.variableAmount / 100).toFixed(2)} ÷ ${input.workingDaysInMonth}) × ${input.sundaysAndHolidaysInMonth}`, legalBasis: 'Lei 605/1949' },
    ],
    totals: { gross: input.variableAmount + dsr, deductions: 0, net: input.variableAmount + dsr },
    steps: [{ label: 'DSR', formula: `(${(input.variableAmount / 100).toFixed(2)} ÷ ${input.workingDaysInMonth}) × ${input.sundaysAndHolidaysInMonth}`, value: dsr }],
    included: [],
    excluded: [],
    warnings: [],
    rulesVersion: rules.id,
  };
}
