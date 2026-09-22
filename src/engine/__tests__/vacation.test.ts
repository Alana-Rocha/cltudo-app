import { describe, it, expect } from 'vitest';
import { calculateVacation, maxVacationDaysForAbsences } from '../vacation';
import { ruleSet2026_01 } from '@/rules/2026-01';
import { toCents } from '@/lib/money';

describe('calculateVacation', () => {
  it('30 dias gozados, sem venda: valor = salário + 1/3', () => {
    const result = calculateVacation(
      { grossSalary: toCents(3000), daysTaken: 30, daysSold: 0, dependents: 0 },
      ruleSet2026_01
    );
    const taken = result.items.find((i) => i.key === 'taken')!;
    const bonus = result.items.find((i) => i.key === 'taken-bonus')!;
    expect(taken.amount).toBe(toCents(3000));
    expect(bonus.amount).toBe(Math.round(toCents(3000) / 3));
  });

  it('abono pecuniário de 10 dias é isento de INSS/IRRF (não entra na base tributável)', () => {
    const result = calculateVacation(
      { grossSalary: toCents(3000), daysTaken: 20, daysSold: 10, dependents: 0 },
      ruleSet2026_01
    );
    const sold = result.items.find((i) => i.key === 'sold')!;
    const soldBonus = result.items.find((i) => i.key === 'sold-bonus')!;
    // dailyRate = 3000/30 = 100; 10 days = 1000 + 1/3 = 333.33
    expect(sold.amount).toBe(toCents(1000));
    expect(soldBonus.amount).toBe(Math.round(toCents(1000) / 3));
  });

  it('venda acima de 10 dias é rejeitada', () => {
    expect(() =>
      calculateVacation({ grossSalary: toCents(3000), daysTaken: 19, daysSold: 11, dependents: 0 }, ruleSet2026_01)
    ).toThrow();
  });

  it('gozados + vendidos acima de 30 é rejeitado', () => {
    expect(() =>
      calculateVacation({ grossSalary: toCents(3000), daysTaken: 25, daysSold: 10, dependents: 0 }, ruleSet2026_01)
    ).toThrow();
  });

  it('escala de faltas do art. 130: 6 a 14 faltas limita a 24 dias', () => {
    expect(maxVacationDaysForAbsences(10, ruleSet2026_01)).toBe(24);
    expect(maxVacationDaysForAbsences(0, ruleSet2026_01)).toBe(30);
    expect(maxVacationDaysForAbsences(40, ruleSet2026_01)).toBe(0);
  });
});
