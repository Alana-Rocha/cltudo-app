import { describe, it, expect } from 'vitest';
import { calculateSalary } from '../salary';
import { ruleSet2026_01 } from '@/rules/2026-01';
import { toCents } from '@/lib/money';

describe('calculateSalary', () => {
  it('líquido = bruto - INSS - IRRF quando não há outros descontos', () => {
    const result = calculateSalary(
      { grossSalary: toCents(3000), dependents: 0 },
      ruleSet2026_01
    );
    const inssItem = result.items.find((i) => i.key === 'inss')!;
    const irrfItem = result.items.find((i) => i.key === 'irrf')!;
    expect(result.totals.net).toBe(toCents(3000) - inssItem.amount - irrfItem.amount);
  });

  it('vale-transporte é limitado a 6% do salário base', () => {
    const result = calculateSalary(
      {
        grossSalary: toCents(2000),
        dependents: 0,
        hasTransportVoucher: true,
        transportVoucherValue: toCents(500), // way above the 6% cap
      },
      ruleSet2026_01
    );
    const vt = result.items.find((i) => i.key === 'vt')!;
    expect(vt.amount).toBe(Math.round(toCents(2000) * 0.06));
    expect(vt.explanation).toContain('Limitado a 6%');
  });

  it('vale-transporte abaixo do teto desconta o custo real', () => {
    const result = calculateSalary(
      {
        grossSalary: toCents(3000),
        dependents: 0,
        hasTransportVoucher: true,
        transportVoucherValue: toCents(100),
      },
      ruleSet2026_01
    );
    const vt = result.items.find((i) => i.key === 'vt')!;
    expect(vt.amount).toBe(toCents(100));
    expect(vt.explanation).not.toContain('Limitado');
  });

  it('pensão alimentícia reduz o líquido e a base do IRRF', () => {
    const withoutAlimony = calculateSalary({ grossSalary: toCents(5000), dependents: 0 }, ruleSet2026_01);
    const withAlimony = calculateSalary(
      { grossSalary: toCents(5000), dependents: 0, alimony: toCents(500) },
      ruleSet2026_01
    );
    expect(withAlimony.totals.net).toBeLessThan(withoutAlimony.totals.net);
    // Net drops by at most the alimony amount (IRRF savings from the lower base offset part of it).
    expect(withoutAlimony.totals.net - withAlimony.totals.net).toBeLessThanOrEqual(toCents(500));
  });
});
