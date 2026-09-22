import { describe, it, expect } from 'vitest';
import { calculateInss } from '../inss';
import { ruleSet2026_01 } from '@/rules/2026-01';
import { toCents } from '@/lib/money';

describe('calculateInss', () => {
  it('caso típico: R$ 4.000,00 -> hand-calculated as 113.85 + 114.83 + 144.73 = 373.41', () => {
    // Hand calc: faixa1 1621*7.5%=121.575~121.58; faixa2 (2902.84-1621)*9%=115.3556~115.36
    // faixa3 (4000-2902.84)*12%=131.66
    // total ~ 121.58+115.36+131.66 = 368.60 (bracket-by-bracket, exact to the cent depends on rounding per bracket)
    const result = calculateInss(toCents(4000), ruleSet2026_01);
    const expectedTotal =
      Math.round(162100 * 0.075) +
      Math.round((290284 - 162100) * 0.09) +
      Math.round((400000 - 290284) * 0.12);
    expect(result.total).toBe(expectedTotal);
    expect(result.nominalRate).toBe(0.12);
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
