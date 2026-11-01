import { describe, expect, it } from 'vitest';
import { earliestRulesDate, fallbackRuleSets, getRulesFor, hasRulesFor } from '../index';
import type { RuleSet } from '../schema';
import { calculateInss } from '@/engine/inss';
import { toCents } from '@/lib/money';

const utc = (year: number, month: number, day: number) => new Date(Date.UTC(year, month - 1, day));

describe('escolha do conjunto de regras pela data', () => {
  it.each([
    [utc(2024, 1, 15), '2024-01'],
    [utc(2024, 2, 1), '2024-02'],
    [utc(2024, 12, 31), '2024-02'],
    [utc(2025, 1, 1), '2025-01'],
    [utc(2025, 4, 30), '2025-01'],
    [utc(2025, 5, 1), '2025-05'],
    [utc(2026, 6, 15), '2026-01'],
  ])('%s usa as regras %s', (date, id) => {
    expect(getRulesFor(date).id).toBe(id);
  });

  it('antes de 2024 não há regras', () => {
    expect(earliestRulesDate()).toEqual(utc(2024, 1, 1));
    expect(hasRulesFor(utc(2023, 12, 31))).toBe(false);
  });
});

describe('teto do INSS de cada ano (desconto máximo publicado)', () => {
  it.each([
    [utc(2024, 6, 1), 908.86],
    [utc(2025, 6, 1), 951.63],
    [utc(2026, 6, 1), 988.09],
  ])('%s: R$ %s', (date, expected) => {
    expect(calculateInss(toCents(20_000), getRulesFor(date)).total).toBe(toCents(expected));
  });
});

/**
 * Confere os números digitados contra eles mesmos: a parcela a deduzir de cada faixa é a anterior mais
 * limite anterior × diferença de alíquota (tolerância de 1 centavo, pelo arredondamento das tabelas oficiais).
 */
function expectDeductionsMatchBrackets(brackets: RuleSet['inss']['brackets']) {
  let expected = 0;
  brackets.forEach((bracket, i) => {
    const previous = brackets[i - 1];
    if (previous) expected += previous.upTo! * (bracket.rate - previous.rate);
    expect(Math.abs(bracket.deduction - expected), `faixa ${i + 1}`).toBeLessThanOrEqual(1);
  });
}

describe.each(fallbackRuleSets.map((rules) => [rules.id, rules] as const))('regras %s: tabelas coerentes', (_, rules) => {
  it('parcelas a deduzir do INSS batem com as faixas', () => {
    expectDeductionsMatchBrackets(rules.inss.brackets);
  });

  it('parcelas a deduzir do IRRF batem com as faixas', () => {
    expectDeductionsMatchBrackets(rules.irrf.brackets);
  });

  it('a 1ª faixa do INSS termina no salário mínimo e o teto fecha a última', () => {
    expect(rules.inss.brackets[0]!.upTo).toBe(rules.minimumWage);
    expect(rules.inss.brackets.at(-1)!.upTo).toBeNull();
    expect(rules.inss.ceiling).toBeGreaterThan(rules.inss.brackets.at(-2)!.upTo!);
  });

  it('desconto simplificado do IRRF é 25% do limite da faixa isenta', () => {
    expect(rules.irrf.simplifiedDiscount).toBe(Math.round(rules.irrf.brackets[0]!.upTo! * 0.25));
  });

  it('seguro-desemprego: a faixa 2 começa onde a faixa 1 termina (80% do limite)', () => {
    const { tier1UpTo, tier1Rate, tier2Base } = rules.unemploymentInsurance;
    // 2 centavos: a tabela oficial de 2024 publicou 1.633,10 para 80% × 2.041,39 = 1.633,112.
    expect(Math.abs(tier2Base - tier1UpTo * tier1Rate)).toBeLessThanOrEqual(2);
  });
});
