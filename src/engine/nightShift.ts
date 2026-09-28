import type { RuleSet } from '@/rules/schema';
import { add, divide, multiply, type Cents } from '@/lib/money';
import type { CalculationResult } from './types';
import { formatDecimal, formatPercent } from '@/lib/format';

export type NightShiftInput = {
  grossSalary: Cents;
  monthlyHours?: number;
  nightHoursWorked: number; // horas efetivamente trabalhadas no período noturno (22h-5h)
  additionalRate?: number; // sobrepõe rules.nightShift.additionalRate quando houver norma coletiva diferente
};

/**
 * Adicional noturno (CLT art. 73). A "hora noturna reduzida" (52min30s)
 * significa que cada hora-relógio trabalhada no período noturno conta como
 * 60/52,5 horas para fins de pagamento — aplicado aqui sobre as horas
 * informadas.
 */
export function calculateNightShift(input: NightShiftInput, rules: RuleSet): CalculationResult {
  const monthlyHours = input.monthlyHours ?? rules.overtime.defaultMonthlyHours;
  const hourlyRate = divide(input.grossSalary, Math.round(monthlyHours));
  const rate = input.additionalRate ?? rules.nightShift.additionalRate;

  const reducedHours = input.nightHoursWorked * (60 / rules.nightShift.reducedHourMinutes);
  const baseAmount = multiply(hourlyRate, reducedHours);
  const additional = multiply(baseAmount, rate);

  return {
    items: [
      { key: 'base', label: 'Horas noturnas (convertidas pela hora reduzida)', amount: baseAmount, type: 'earning', explanation: `${input.nightHoursWorked}h × (60 ÷ ${rules.nightShift.reducedHourMinutes}min) × ${formatDecimal(hourlyRate / 100, 2)}` },
      { key: 'additional', label: `Adicional noturno (${formatPercent(rate, 0)})`, amount: additional, type: 'earning', explanation: 'Sobre as horas noturnas convertidas', legalBasis: 'CLT art. 73' },
    ],
    totals: { gross: add(baseAmount, additional), deductions: 0, net: add(baseAmount, additional) },
    steps: [
      { label: 'Valor-hora', formula: `${formatDecimal(input.grossSalary / 100, 2)} ÷ ${monthlyHours}h`, value: hourlyRate },
      { label: 'Horas noturnas convertidas', formula: `${input.nightHoursWorked}h × (60/${rules.nightShift.reducedHourMinutes})`, value: Math.round(reducedHours * 100), unit: 'hours' },
    ],
    included: [],
    excluded: [],
    warnings: [
      'O adicional noturno pode ser maior por convenção ou acordo coletivo — confira sua categoria.',
    ],
    rulesVersion: rules.id,
  };
}
