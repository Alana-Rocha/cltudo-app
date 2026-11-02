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

  it('média de variáveis habituais entra na base das férias (CLT art. 142, §5º)', () => {
    const result = calculateVacation(
      { grossSalary: toCents(3000), daysTaken: 30, daysSold: 0, dependents: 0, averageVariables: toCents(600) },
      ruleSet2026_01
    );
    expect(result.items.find((i) => i.key === 'taken')!.amount).toBe(toCents(3600));
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

  it('não arredonda o valor diário: 30 dias com salário de R$ 2.000 valem R$ 2.000,00 + R$ 666,67', () => {
    const result = calculateVacation({ grossSalary: toCents(2000), daysTaken: 30, daysSold: 0, dependents: 0 }, ruleSet2026_01);
    expect(result.items.find((i) => i.key === 'taken')!.amount).toBe(toCents(2000));
    expect(result.items.find((i) => i.key === 'taken-bonus')!.amount).toBe(toCents(666.67));
  });

  it('dependentes reduzem o IRRF das férias acima da faixa de isenção', () => {
    // Férias + 1/3 = 6.666,67; INSS 734,84; redutor 978,62 − 0,133145 × 6.666,67 = 90,99
    // 0 dep.: 5.931,83 × 27,5% − 908,73 − 90,99 = 631,53
    // 6 dep.: (5.931,83 − 6 × 189,59) × 27,5% − 908,73 − 90,99 = 318,71
    const irrfWith = (dependents: number) =>
      calculateVacation({ grossSalary: toCents(5000), daysTaken: 30, daysSold: 0, dependents }, ruleSet2026_01).items.find(
        (i) => i.key === 'irrf'
      )!.amount;
    expect(irrfWith(0)).toBe(toCents(631.53));
    expect(irrfWith(6)).toBe(toCents(318.71));
  });

  describe('aviso de IRRF zerado pela Lei 15.270/2025', () => {
    const warningsFor = (grossSalary: number, dependents: number) =>
      calculateVacation({ grossSalary: toCents(grossSalary), daysTaken: 30, daysSold: 0, dependents }, ruleSet2026_01).warnings;

    it('explica por que os dependentes não mudam o valor quando férias + 1/3 ficam até R$ 5.000', () => {
      expect(warningsFor(3750, 6)).toEqual([expect.stringMatching(/IRRF fica zerado.*dependentes não alteram/)]);
    });

    it('não aparece sem dependentes nem acima da faixa de isenção', () => {
      expect(warningsFor(3750, 0)).toEqual([]);
      expect(warningsFor(3751, 6)).toEqual([]);
    });
  });
});
