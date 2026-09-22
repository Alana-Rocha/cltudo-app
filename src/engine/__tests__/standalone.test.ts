import { describe, it, expect } from 'vitest';
import { calculateInssStandalone } from '../inss';
import { calculateIrrfStandalone } from '../irrf';
import { calculateNoticeStandalone } from '../notice';
import { calculateFgtsStandalone } from '../fgts';
import { ruleSet2026_01 } from '@/rules/2026-01';
import { toCents } from '@/lib/money';

describe('calculateInssStandalone', () => {
  it('produz um CalculationResult com o total de INSS como dedução', () => {
    const result = calculateInssStandalone(toCents(4000), ruleSet2026_01);
    expect(result.totals.deductions).toBeGreaterThan(0);
    expect(result.totals.net).toBe(toCents(4000) - result.totals.deductions);
  });

  it('avisa quando o salário está acima do teto', () => {
    const result = calculateInssStandalone(ruleSet2026_01.inss.ceiling + toCents(1000), ruleSet2026_01);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('calculateIrrfStandalone', () => {
  it('produz um CalculationResult com o IRRF como dedução', () => {
    const result = calculateIrrfStandalone(
      { taxableIncome: toCents(9000), inss: toCents(900), dependents: 1 },
      ruleSet2026_01
    );
    expect(result.totals.deductions).toBeGreaterThanOrEqual(0);
  });
});

describe('calculateNoticeStandalone', () => {
  it('pedido de demissão exclui o acréscimo por tempo de serviço', () => {
    const result = calculateNoticeStandalone(
      new Date(Date.UTC(2015, 0, 1)),
      new Date(Date.UTC(2026, 0, 1)),
      'employee_resignation',
      ruleSet2026_01
    );
    expect(result.excluded.length).toBeGreaterThan(0);
    expect(result.steps[0].value).toBe(30);
  });

  it('sem justa causa com 5 anos completos soma 15 dias extras', () => {
    const result = calculateNoticeStandalone(
      new Date(Date.UTC(2021, 0, 1)),
      new Date(Date.UTC(2026, 0, 2)),
      'without_cause',
      ruleSet2026_01
    );
    expect(result.steps[0].value).toBe(45); // 30 + 5*3
  });
});

describe('calculateFgtsStandalone', () => {
  it('depósito mensal = salário × 8%', () => {
    const result = calculateFgtsStandalone({ grossSalary: toCents(3000) }, ruleSet2026_01);
    expect(result.totals.net).toBe(Math.round(toCents(3000) * 0.08));
  });

  it('aprendiz usa alíquota de 2%', () => {
    const result = calculateFgtsStandalone({ grossSalary: toCents(1621), isApprentice: true }, ruleSet2026_01);
    expect(result.totals.net).toBe(Math.round(toCents(1621) * 0.02));
  });

  it('inclui a multa rescisória quando informado o contexto de rescisão', () => {
    const result = calculateFgtsStandalone(
      {
        grossSalary: toCents(3000),
        rescission: {
          terminationType: 'without_cause',
          monthsEmployed: 24,
          thirteenthAmount: toCents(3000),
          vacationTakenAmount: 0,
          noticeIndemnifiedAmount: toCents(3000),
          balanceAmount: toCents(1000),
        },
      },
      ruleSet2026_01
    );
    const fine = result.items.find((i) => i.key === 'fine')!;
    expect(fine.amount).toBeGreaterThan(0);
  });
});
