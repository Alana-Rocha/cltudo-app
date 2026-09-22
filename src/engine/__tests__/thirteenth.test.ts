import { describe, it, expect } from 'vitest';
import { calculateThirteenth } from '../thirteenth';
import { ruleSet2026_01 } from '@/rules/2026-01';
import { toCents } from '@/lib/money';

describe('calculateThirteenth', () => {
  it('12 avos = salário integral', () => {
    const result = calculateThirteenth(
      { grossSalary: toCents(3000), monthsWorked: 12, dependents: 0 },
      ruleSet2026_01
    );
    const full = result.items.find((i) => i.key === 'full')!;
    expect(full.amount).toBe(toCents(3000));
  });

  it('1ª parcela é sempre 50% do integral, sem descontos', () => {
    const result = calculateThirteenth(
      { grossSalary: toCents(4000), monthsWorked: 8, dependents: 2 },
      ruleSet2026_01
    );
    const full = result.items.find((i) => i.key === 'full')!;
    const first = result.items.find((i) => i.key === 'first')!;
    expect(first.amount).toBe(Math.round(full.amount * 0.5));
  });

  it('2ª parcela = integral - INSS - IRRF - 1ª parcela', () => {
    const result = calculateThirteenth(
      { grossSalary: toCents(4000), monthsWorked: 12, dependents: 0 },
      ruleSet2026_01
    );
    const full = result.items.find((i) => i.key === 'full')!;
    const first = result.items.find((i) => i.key === 'first')!;
    const second = result.items.find((i) => i.key === 'second')!;
    expect(second.amount).toBe(full.amount - result.totals.deductions - first.amount);
  });

  it('média de variáveis aumenta a base do 13º', () => {
    const withoutVariables = calculateThirteenth(
      { grossSalary: toCents(3000), monthsWorked: 12, dependents: 0 },
      ruleSet2026_01
    );
    const withVariables = calculateThirteenth(
      { grossSalary: toCents(3000), monthsWorked: 12, dependents: 0, averageVariables: toCents(500) },
      ruleSet2026_01
    );
    const fullWith = withVariables.items.find((i) => i.key === 'full')!;
    const fullWithout = withoutVariables.items.find((i) => i.key === 'full')!;
    expect(fullWith.amount).toBe(fullWithout.amount + toCents(500));
  });

  it('rejeita monthsWorked fora de 0..12', () => {
    expect(() =>
      calculateThirteenth({ grossSalary: toCents(3000), monthsWorked: 13, dependents: 0 }, ruleSet2026_01)
    ).toThrow();
  });
});
