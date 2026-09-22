import { describe, it, expect } from 'vitest';
import { calculateOvertime } from '../overtime';
import { ruleSet2026_01 } from '@/rules/2026-01';
import { toCents } from '@/lib/money';

describe('calculateOvertime', () => {
  it('valor-hora = salário ÷ jornada mensal padrão (220h)', () => {
    const result = calculateOvertime(
      { grossSalary: toCents(2200), lines: [{ hours: 0, rate: 0.5 }], workingDaysInMonth: 22, sundaysAndHolidaysInMonth: 4 },
      ruleSet2026_01
    );
    const hourlyStep = result.steps.find((s) => s.label === 'Valor-hora')!;
    expect(hourlyStep.value).toBe(toCents(10)); // 2200/220 = 10
  });

  it('50% e 100% calculados corretamente em linhas separadas', () => {
    const result = calculateOvertime(
      {
        grossSalary: toCents(2200), // hourly = 10
        lines: [
          { hours: 10, rate: 0.5 }, // 10 * 10 * 1.5 = 150
          { hours: 5, rate: 1.0 }, // 5 * 10 * 2.0 = 100
        ],
        workingDaysInMonth: 22,
        sundaysAndHolidaysInMonth: 4,
      },
      ruleSet2026_01
    );
    expect(result.items[0].amount).toBe(toCents(150));
    expect(result.items[1].amount).toBe(toCents(100));
  });

  it('DSR proporcional aos domingos e feriados do mês', () => {
    const result = calculateOvertime(
      {
        grossSalary: toCents(2200),
        lines: [{ hours: 22, rate: 0.5 }], // total = 22*10*1.5 = 330
        workingDaysInMonth: 22,
        sundaysAndHolidaysInMonth: 5,
      },
      ruleSet2026_01
    );
    const dsr = result.items.find((i) => i.key === 'dsr')!;
    expect(dsr.amount).toBe(Math.round((toCents(330) / 22) * 5));
  });

  it('jornada mensal customizada é respeitada', () => {
    const result = calculateOvertime(
      { grossSalary: toCents(1800), monthlyHours: 180, lines: [], workingDaysInMonth: 22, sundaysAndHolidaysInMonth: 4 },
      ruleSet2026_01
    );
    const hourlyStep = result.steps.find((s) => s.label === 'Valor-hora')!;
    expect(hourlyStep.value).toBe(toCents(10));
  });
});
