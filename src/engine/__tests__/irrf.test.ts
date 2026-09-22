import { describe, it, expect } from 'vitest';
import { calculateIrrf } from '../irrf';
import { ruleSet2026_01 } from '@/rules/2026-01';
import { toCents } from '@/lib/money';

describe('calculateIrrf', () => {
  it('rendimento abaixo da isenção total do redutor (<= R$5.000): imposto zerado', () => {
    const result = calculateIrrf(
      { taxableIncome: toCents(4500), inss: toCents(400), dependents: 0 },
      ruleSet2026_01
    );
    expect(result.total).toBe(0);
  });

  it('zero dependentes vs vários dependentes: mais dependentes reduz a base e o imposto', () => {
    const noDependents = calculateIrrf(
      { taxableIncome: toCents(9000), inss: toCents(900), dependents: 0 },
      ruleSet2026_01
    );
    const withDependents = calculateIrrf(
      { taxableIncome: toCents(9000), inss: toCents(900), dependents: 3 },
      ruleSet2026_01
    );
    expect(withDependents.base).toBeLessThan(noDependents.base);
    expect(withDependents.total).toBeLessThanOrEqual(noDependents.total);
  });

  it('usa o desconto simplificado quando é mais vantajoso que as deduções legais', () => {
    // High income, zero dependents, zero other deductions: only INSS legal
    // deduction competes with the flat simplified discount.
    const result = calculateIrrf(
      { taxableIncome: toCents(3000), inss: toCents(50), dependents: 0 },
      ruleSet2026_01
    );
    expect(result.usedSimplifiedDiscount).toBe(true);
  });

  it('usa deduções legais quando são maiores que o desconto simplificado', () => {
    const result = calculateIrrf(
      { taxableIncome: toCents(10000), inss: toCents(900), dependents: 4 },
      ruleSet2026_01
    );
    expect(result.usedSimplifiedDiscount).toBe(false);
  });

  it('rendimento tributável acima da faixa de transição do redutor: sem redução', () => {
    const result = calculateIrrf(
      { taxableIncome: toCents(20000), inss: toCents(900), dependents: 0 },
      ruleSet2026_01
    );
    expect(result.reducerApplied).toBe(0);
    expect(result.total).toBe(result.taxBeforeReducer);
  });

  it('base nunca fica negativa mesmo com deduções maiores que o rendimento', () => {
    const result = calculateIrrf(
      { taxableIncome: toCents(1000), inss: toCents(2000), dependents: 5 },
      ruleSet2026_01
    );
    expect(result.base).toBe(0);
    expect(result.total).toBe(0);
  });
});
