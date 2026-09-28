import { describe, it, expect } from 'vitest';
import { calculateRaise } from '../raise';
import { calculateSalary } from '../salary';
import { ruleSet2026_01 } from '@/rules/2026-01';
import { toCents } from '@/lib/money';

describe('calculateRaise', () => {
  it('aumento líquido = líquido novo − líquido atual', () => {
    const result = calculateRaise({ currentGross: toCents(3000), newGross: toCents(3500), dependents: 0 }, ruleSet2026_01);
    const before = calculateSalary({ grossSalary: toCents(3000), dependents: 0 }, ruleSet2026_01).totals.net;
    const after = calculateSalary({ grossSalary: toCents(3500), dependents: 0 }, ruleSet2026_01).totals.net;
    expect(result.totals.gross).toBe(toCents(500));
    expect(result.totals.net).toBe(after - before);
    expect(result.totals.deductions).toBe(toCents(500) - (after - before));
  });

  it('abaixo de R$ 5.000 só o INSS pesa (IRRF continua zerado)', () => {
    const result = calculateRaise({ currentGross: toCents(3000), newGross: toCents(3500), dependents: 0 }, ruleSet2026_01);
    expect(result.items.find((i) => i.key === 'irrf-delta')!.amount).toBe(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('na faixa de transição do redutor, mais de 35% do aumento vira desconto e há aviso', () => {
    const result = calculateRaise({ currentGross: toCents(5500), newGross: toCents(6000), dependents: 0 }, ruleSet2026_01);
    expect(result.totals.deductions / result.totals.gross).toBeGreaterThan(0.35);
    expect(result.warnings[0]).toContain('redução do Imposto de Renda');
  });

  it('acima do teto do INSS e da faixa de transição, perde 27,5% (só IRRF)', () => {
    const result = calculateRaise({ currentGross: toCents(10000), newGross: toCents(11000), dependents: 0 }, ruleSet2026_01);
    expect(result.items.find((i) => i.key === 'inss-delta')!.amount).toBe(0);
    expect(result.totals.deductions).toBe(toCents(275));
  });
});
