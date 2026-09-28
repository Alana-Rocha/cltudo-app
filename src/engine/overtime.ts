import type { RuleSet } from '@/rules/schema';
import { add, divide, multiply, type Cents } from '@/lib/money';
import type { CalculationResult } from './types';
import { formatDecimal, formatPercent } from '@/lib/format';

export type OvertimeLine = { hours: number; rate: number }; // rate: 0.5, 1.0 or custom

export type OvertimeInput = {
  grossSalary: Cents;
  monthlyHours?: number; // defaults to rules.overtime.defaultMonthlyHours
  habitualAllowances?: Cents; // adicional noturno/insalubridade/periculosidade habituais (opcional)
  lines: OvertimeLine[];
  workingDaysInMonth: number;
  sundaysAndHolidaysInMonth: number;
};

export function calculateOvertime(input: OvertimeInput, rules: RuleSet): CalculationResult {
  const monthlyHours = input.monthlyHours ?? rules.overtime.defaultMonthlyHours;
  const hourlyBase = add(input.grossSalary, input.habitualAllowances ?? 0);
  const hourlyRate = divide(hourlyBase, Math.round(monthlyHours));

  let totalOvertime: Cents = 0;
  const lineItems = input.lines.map((line, i) => {
    const amount = multiply(hourlyRate, (1 + line.rate) * line.hours);
    totalOvertime = add(totalOvertime, amount);
    return {
      key: `he-${i}`,
      label: `Hora extra ${formatPercent(line.rate, 0)} (${line.hours}h)`,
      amount,
      type: 'earning' as const,
      explanation: `${formatDecimal(hourlyRate / 100, 2)} × (1 + ${formatPercent(line.rate, 0)}) × ${line.hours}h`,
    };
  });

  const dsr =
    input.workingDaysInMonth > 0
      ? multiply(divide(totalOvertime, input.workingDaysInMonth), input.sundaysAndHolidaysInMonth)
      : 0;

  return {
    items: [
      ...lineItems,
      { key: 'dsr', label: 'DSR sobre horas extras', amount: dsr, type: 'earning', explanation: `(total HE ÷ dias úteis) × (domingos + feriados)`, legalBasis: 'Lei 605/1949' },
    ],
    totals: { gross: add(totalOvertime, dsr), deductions: 0, net: add(totalOvertime, dsr) },
    steps: [
      { label: 'Valor-hora', formula: `${formatDecimal(hourlyBase / 100, 2)} ÷ ${monthlyHours}h`, value: hourlyRate },
      { label: 'Total de horas extras', formula: 'Soma das linhas', value: totalOvertime },
      { label: 'DSR sobre HE', formula: `${formatDecimal(totalOvertime / 100, 2)} ÷ ${input.workingDaysInMonth} × ${input.sundaysAndHolidaysInMonth}`, value: dsr },
    ],
    included: [],
    excluded: [],
    warnings: [],
    rulesVersion: rules.id,
  };
}
