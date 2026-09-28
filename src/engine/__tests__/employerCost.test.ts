import { describe, it, expect } from 'vitest';
import { calculateEmployerCost } from '../employerCost';
import { ruleSet2026_01 } from '@/rules/2026-01';
import { toCents } from '@/lib/money';

const amount = (r: ReturnType<typeof calculateEmployerCost>, key: string) => r.items.find((i) => i.key === key)?.amount;

describe('calculateEmployerCost', () => {
  it('Lucro Presumido/Real: salário 3.000, RAT 2%', () => {
    // Base = 3.000 + 250 (13º) + 333,33 (férias + 1/3) = 3.583,33
    const r = calculateEmployerCost({ grossSalary: toCents(3000), regime: 'standard', ratRate: 0.02 }, ruleSet2026_01);
    expect(amount(r, 'fgts')).toBe(toCents(286.67));
    expect(amount(r, 'cpp')).toBe(toCents(716.67));
    expect(amount(r, 'rat')).toBe(toCents(71.67));
    expect(amount(r, 'third-parties')).toBe(toCents(207.83));
    expect(r.totals.net).toBe(toCents(4866.17));
  });

  it('Simples Nacional: só FGTS sobre a base, sem INSS patronal, RAT ou terceiros', () => {
    const r = calculateEmployerCost({ grossSalary: toCents(3000), regime: 'simples', ratRate: 0.02 }, ruleSet2026_01);
    expect(amount(r, 'cpp')).toBe(0);
    expect(amount(r, 'rat')).toBe(0);
    expect(amount(r, 'third-parties')).toBe(0);
    expect(r.totals.net).toBe(toCents(3870));
  });

  it('Anexo IV: INSS patronal e RAT, sem terceiros', () => {
    const r = calculateEmployerCost({ grossSalary: toCents(3000), regime: 'simples_annex_iv', ratRate: 0.03 }, ruleSet2026_01);
    expect(amount(r, 'cpp')).toBeGreaterThan(0);
    expect(amount(r, 'rat')).toBe(toCents(107.5));
    expect(amount(r, 'third-parties')).toBe(0);
  });

  it('vale-transporte: a empresa paga só o que passa de 6% do salário', () => {
    const r = calculateEmployerCost(
      { grossSalary: toCents(3000), regime: 'simples', ratRate: 0.02, transportVoucherCost: toCents(300) },
      ruleSet2026_01
    );
    expect(amount(r, 'vt')).toBe(toCents(120)); // 300 − 6% × 3.000
  });
});
