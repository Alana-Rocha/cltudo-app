import { describe, it, expect } from 'vitest';
import { bestPjScenario, calculateCltVsPj } from '../cltVsPj';
import { ruleSet2026_01 } from '@/rules/2026-01';
import { toCents } from '@/lib/money';

describe('bestPjScenario', () => {
  it('R$ 10.000/mês: Anexo III com fator R vence o Anexo V', () => {
    // III: pró-labore 2.800 (28%), DAS 6% = 600, INSS 11% = 308, IRRF 0, lucro 6.600 → 9.092
    // V:   pró-labore 1.621, DAS 15,5% = 1.550, INSS 178,31, lucro 6.829 → 8.271,69
    const pj = bestPjScenario(toCents(10000), 0, 0, ruleSet2026_01)!;
    expect(pj.annex).toBe('III');
    expect(pj.proLabore).toBe(toCents(2800));
    expect(pj.das).toBe(toCents(600));
    expect(pj.inss).toBe(toCents(308));
    expect(pj.irrf).toBe(0);
    expect(pj.monthlyNet).toBe(toCents(9092));
  });

  it('acima do limite do Simples não há cenário', () => {
    expect(bestPjScenario(toCents(500_000), 0, 0, ruleSet2026_01)).toBeNull();
  });

  it('lucro acima de R$ 50 mil/mês paga 10% sobre o total distribuído', () => {
    const pj = bestPjScenario(toCents(100_000), 0, 0, ruleSet2026_01)!;
    expect(pj.profit).toBeGreaterThan(toCents(50_000));
    expect(pj.dividendTax).toBe(Math.round(pj.profit * 0.1));
  });
});

describe('calculateCltVsPj', () => {
  it('diferença = PJ anual − pacote CLT anual', () => {
    const r = calculateCltVsPj({ cltGross: toCents(8000), dependents: 0, pjMonthlyRevenue: toCents(10000) }, ruleSet2026_01);
    const clt = r.items.find((i) => i.key === 'clt-total')!.amount;
    const pj = r.items.find((i) => i.key === 'pj-total')!.amount;
    expect(pj).toBe(toCents(9092) * 12);
    expect(r.totals.net).toBe(pj - clt);
  });

  it('o faturamento equivalente iguala (ou supera por centavos) o pacote CLT', () => {
    const r = calculateCltVsPj(
      { cltGross: toCents(8000), dependents: 0, pjMonthlyRevenue: toCents(10000), pjMonthlyCosts: toCents(300) },
      ruleSet2026_01
    );
    const clt = r.items.find((i) => i.key === 'clt-total')!.amount;
    const equivalent = r.items.find((i) => i.key === 'equivalent')!.amount;
    const atEquivalent = bestPjScenario(equivalent, toCents(300), 0, ruleSet2026_01)!.monthlyNet * 12;
    const justBelow = bestPjScenario(equivalent - 1, toCents(300), 0, ruleSet2026_01)!.monthlyNet * 12;
    expect(atEquivalent).toBeGreaterThanOrEqual(clt);
    expect(justBelow).toBeLessThan(clt);
  });
});
