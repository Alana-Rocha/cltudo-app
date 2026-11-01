import { describe, it, expect } from 'vitest';
import { calculateInss } from '../inss';
import { ruleSet2026_01 } from '@/rules/2026-01';
import { toCents } from '@/lib/money';

describe('calculateInss', () => {
  it('caso típico: R$ 4.000,00 -> 121,575 + 115,3656 + 131,6592 = 368,5998 -> R$ 368,60', () => {
    // Soma exata das faixas, arredondada uma vez só (igual a 4.000 × 12% − 111,40 da tabela oficial).
    const result = calculateInss(toCents(4000), ruleSet2026_01);
    expect(result.total).toBe(toCents(368.6));
    expect(result.nominalRate).toBe(0.12);
  });

  it('teto de 2026: desconto máximo é R$ 988,09 (8.475,55 × 14% − 198,49)', () => {
    expect(calculateInss(ruleSet2026_01.inss.ceiling, ruleSet2026_01).total).toBe(toCents(988.09));
  });

  it('bate com a fórmula da parcela a deduzir da tabela oficial em toda a faixa salarial', () => {
    const { brackets, ceiling } = ruleSet2026_01.inss;
    for (let cents = 100_000; cents <= 900_000; cents += 1_337) {
      const base = Math.min(cents, ceiling);
      const index = brackets.findIndex((b) => b.upTo === null || base <= b.upTo);
      // Parcela a deduzir sem arredondar, derivada das próprias faixas: Σ limite × (próxima alíquota − alíquota).
      // Tudo em pontos-base (inteiros) para o ponto flutuante não mexer no arredondamento de x,5 centavos.
      const bp = (rate: number) => Math.round(rate * 10_000);
      const deduction = brackets
        .slice(0, index)
        .reduce((sum, b, i) => sum + b.upTo! * (bp(brackets[i + 1]!.rate) - bp(b.rate)), 0);
      expect(calculateInss(cents, ruleSet2026_01).total).toBe(Math.round((base * bp(brackets[index]!.rate) - deduction) / 10_000));
    }
  });

  it('as faixas exibidas somam exatamente o total', () => {
    for (const cents of [toCents(3000), toCents(4000), toCents(6000), toCents(10000)]) {
      const result = calculateInss(cents, ruleSet2026_01);
      expect(result.brackets.reduce((sum, b) => sum + b.amount, 0)).toBe(result.total);
    }
  });

  it('salário exatamente no limite superior da faixa 1 (salário mínimo)', () => {
    const result = calculateInss(162100, ruleSet2026_01);
    expect(result.brackets).toHaveLength(1);
    expect(result.total).toBe(Math.round(162100 * 0.075));
    expect(result.nominalRate).toBe(0.075);
  });

  it('salário 1 centavo acima do limite da faixa 1 entra na faixa 2', () => {
    const result = calculateInss(162101, ruleSet2026_01);
    expect(result.brackets).toHaveLength(2);
    expect(result.nominalRate).toBe(0.09);
  });

  it('salário no teto: desconto máximo é limitado', () => {
    const result = calculateInss(ruleSet2026_01.inss.ceiling, ruleSet2026_01);
    expect(result.cappedBase).toBe(ruleSet2026_01.inss.ceiling);
    expect(result.nominalRate).toBe(0.14);
  });

  it('salário acima do teto: base é limitada ao teto, desconto não aumenta', () => {
    const atCeiling = calculateInss(ruleSet2026_01.inss.ceiling, ruleSet2026_01);
    const aboveCeiling = calculateInss(ruleSet2026_01.inss.ceiling + toCents(1000), ruleSet2026_01);
    expect(aboveCeiling.total).toBe(atCeiling.total);
    expect(aboveCeiling.cappedBase).toBe(ruleSet2026_01.inss.ceiling);
  });

  it('salário zero resulta em desconto zero', () => {
    const result = calculateInss(0, ruleSet2026_01);
    expect(result.total).toBe(0);
    expect(result.brackets).toHaveLength(0);
  });

  it('alíquota efetiva é sempre menor que a nominal para salários que cruzam faixas', () => {
    const result = calculateInss(toCents(6000), ruleSet2026_01);
    expect(result.effectiveRate).toBeLessThan(result.nominalRate);
  });
});
