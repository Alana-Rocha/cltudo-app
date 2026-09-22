import type { RuleSet } from '@/rules/schema';
import { add, divide, multiply, subtract, type Cents } from '@/lib/money';
import { calculateInss } from './inss';
import { calculateIrrf } from './irrf';
import type { CalculationResult } from './types';

export type VacationInput = {
  grossSalary: Cents;
  daysTaken: number; // 1..30
  daysSold: number; // 0..10 (abono pecuniário)
  dependents: number;
  unjustifiedAbsences?: number;
};

/** CLT art. 130 — maximum vacation days by unjustified absences. */
export function maxVacationDaysForAbsences(absences: number, rules: RuleSet): number {
  const tier = rules.vacation.absenceScale.find(
    (t) => absences >= t.minAbsences && (t.maxAbsences === null || absences <= t.maxAbsences)
  );
  return tier ? tier.days : 0;
}

export function calculateVacation(input: VacationInput, rules: RuleSet): CalculationResult {
  if (input.daysTaken + input.daysSold > 30) {
    throw new Error('daysTaken + daysSold must not exceed 30');
  }
  const maxSoldDays = Math.floor(30 * rules.vacation.maxSoldFraction);
  if (input.daysSold > maxSoldDays) {
    throw new Error(`daysSold must not exceed ${maxSoldDays}`);
  }

  const dailyRate = divide(input.grossSalary, 30);

  const takenValue = multiply(dailyRate, input.daysTaken);
  const takenBonus = multiply(takenValue, rules.vacation.bonusFraction);
  const taxableVacation = add(takenValue, takenBonus);

  const soldValue = multiply(dailyRate, input.daysSold);
  const soldBonus = multiply(soldValue, rules.vacation.bonusFraction);
  const soldTotal = add(soldValue, soldBonus); // isento de INSS/IRRF

  const inss = calculateInss(taxableVacation, rules);
  const irrf = calculateIrrf(
    { taxableIncome: taxableVacation, inss: inss.total, dependents: input.dependents },
    rules
  );

  const net = add(subtract(taxableVacation, add(inss.total, irrf.total)), soldTotal);

  const warnings: string[] = [];
  if (input.unjustifiedAbsences !== undefined) {
    const maxDays = maxVacationDaysForAbsences(input.unjustifiedAbsences, rules);
    if (maxDays < 30) {
      warnings.push(
        `Com ${input.unjustifiedAbsences} falta(s) injustificada(s) no período aquisitivo, o limite de dias de férias é ${maxDays} (CLT art. 130).`
      );
    }
  }

  return {
    items: [
      { key: 'taken', label: `Férias gozadas (${input.daysTaken} dias)`, amount: takenValue, type: 'earning', explanation: `${(input.grossSalary / 100).toFixed(2)} ÷ 30 × ${input.daysTaken}` },
      { key: 'taken-bonus', label: '1/3 constitucional (gozadas)', amount: takenBonus, type: 'earning', explanation: '1/3 sobre as férias gozadas', legalBasis: 'CF art. 7º, XVII' },
      { key: 'inss', label: 'INSS sobre férias', amount: inss.total, type: 'deduction', explanation: 'Sobre férias gozadas + 1/3' },
      { key: 'irrf', label: 'IRRF sobre férias', amount: irrf.total, type: 'deduction', explanation: 'Sobre férias gozadas + 1/3, tributação separada do salário' },
      ...(input.daysSold > 0
        ? [
            { key: 'sold', label: `Abono pecuniário (${input.daysSold} dias)`, amount: soldValue, type: 'earning' as const, explanation: 'Venda de dias de férias', legalBasis: 'CLT art. 143' },
            { key: 'sold-bonus', label: '1/3 do abono', amount: soldBonus, type: 'earning' as const, explanation: 'Isento de INSS e IRRF' },
          ]
        : []),
    ],
    totals: { gross: add(taxableVacation, soldTotal), deductions: add(inss.total, irrf.total), net },
    steps: [...inss.steps, ...irrf.steps],
    included: [],
    excluded: [],
    warnings,
    rulesVersion: rules.id,
  };
}
