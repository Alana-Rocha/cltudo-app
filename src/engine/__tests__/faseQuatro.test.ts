import { describe, it, expect } from 'vitest';
import { calculateNightShift } from '../nightShift';
import { calculateUnhealthiness } from '../unhealthiness';
import { calculateHazardPay } from '../hazardPay';
import { calculateDsr } from '../dsr';
import { calculateCompTime } from '../compTime';
import { calculateProportionalSalary } from '../proportionalSalary';
import { calculateMaternityLeave } from '../maternityLeave';
import { calculateUnemploymentInsurance } from '../unemploymentInsurance';
import { ruleSet2026_01 } from '@/rules/2026-01';
import { toCents } from '@/lib/money';

describe('calculateNightShift', () => {
  it('converte horas noturnas pela hora reduzida e aplica o adicional', () => {
    const result = calculateNightShift(
      { grossSalary: toCents(2200), monthlyHours: 220, nightHoursWorked: 52.5 },
      ruleSet2026_01
    );
    // hourlyRate = 10; reducedHours = 52.5 * (60/52.5) = 60; base = 600; additional 20% = 120
    const base = result.items.find((i) => i.key === 'base')!;
    const additional = result.items.find((i) => i.key === 'additional')!;
    expect(base.amount).toBe(toCents(600));
    expect(additional.amount).toBe(toCents(120));
  });
});

describe('calculateUnhealthiness', () => {
  it('usa o salário mínimo como base padrão', () => {
    const result = calculateUnhealthiness({ grade: 'medium' }, ruleSet2026_01);
    const item = result.items[0]!;
    expect(item.amount).toBe(Math.round(ruleSet2026_01.minimumWage * 0.2));
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('grau máximo = 40%', () => {
    const result = calculateUnhealthiness({ grade: 'high', base: toCents(2000) }, ruleSet2026_01);
    expect(result.items[0]!.amount).toBe(toCents(800));
    expect(result.warnings.length).toBe(0);
  });
});

describe('calculateHazardPay', () => {
  it('30% sobre o salário base', () => {
    const result = calculateHazardPay({ baseSalary: toCents(3000) }, ruleSet2026_01);
    expect(result.items[0]!.amount).toBe(toCents(900));
  });
});

describe('calculateDsr', () => {
  it('DSR proporcional a domingos e feriados', () => {
    const result = calculateDsr(
      { variableAmount: toCents(2200), workingDaysInMonth: 22, sundaysAndHolidaysInMonth: 4 },
      ruleSet2026_01
    );
    const dsr = result.items.find((i) => i.key === 'dsr')!;
    expect(dsr.amount).toBe(toCents(400));
  });
});

describe('calculateCompTime', () => {
  it('saldo positivo mostra o valor se pago como hora extra', () => {
    const result = calculateCompTime(
      { grossSalary: toCents(2200), monthlyHours: 220, balanceHours: 10 },
      ruleSet2026_01
    );
    const payout = result.items.find((i) => i.key === 'payout')!;
    expect(payout.amount).toBe(toCents(150)); // 10 * 10 * 1.5
  });

  it('saldo negativo não gera valor de pagamento', () => {
    const result = calculateCompTime(
      { grossSalary: toCents(2200), monthlyHours: 220, balanceHours: -5 },
      ruleSet2026_01
    );
    expect(result.items.find((i) => i.key === 'payout')).toBeUndefined();
  });
});

describe('calculateProportionalSalary', () => {
  it('15 dias = metade do salário bruto, proporcionalmente', () => {
    const result = calculateProportionalSalary(
      { grossSalary: toCents(3000), daysWorked: 15, dependents: 0 },
      ruleSet2026_01
    );
    const proportional = result.items.find((i) => i.key === 'proportional')!;
    expect(proportional.amount).toBe(toCents(1500));
  });
});

describe('calculateMaternityLeave', () => {
  it('120 dias = 4 meses de remuneração', () => {
    const result = calculateMaternityLeave({ monthlyAmount: toCents(3000) }, ruleSet2026_01);
    const total = result.items.find((i) => i.key === 'total')!;
    expect(total.amount).toBe(toCents(12000));
  });

  it('Empresa Cidadã estende para 180 dias', () => {
    const result = calculateMaternityLeave({ monthlyAmount: toCents(3000), extendedProgram: true }, ruleSet2026_01);
    const total = result.items.find((i) => i.key === 'total')!;
    expect(total.amount).toBe(toCents(18000));
  });

  it('desconta INSS e IRRF mês a mês e multiplica o líquido pelo período', () => {
    const result = calculateMaternityLeave({ monthlyAmount: toCents(8000) }, ruleSet2026_01);
    const inss = result.items.find((i) => i.key === 'inss')!.amount;
    const irrf = result.items.find((i) => i.key === 'irrf')!.amount;
    expect(inss).toBeGreaterThan(0);
    expect(irrf).toBeGreaterThan(0); // acima de R$ 7.350 não há redutor
    expect(result.totals.deductions).toBe(4 * (inss + irrf));
    expect(result.totals.net).toBe(4 * (toCents(8000) - inss - irrf));
  });

  it('até R$ 5.000 o IRRF é zerado pelo redutor, mas o INSS continua', () => {
    const result = calculateMaternityLeave({ monthlyAmount: toCents(3000) }, ruleSet2026_01);
    expect(result.items.find((i) => i.key === 'irrf')!.amount).toBe(0);
    expect(result.items.find((i) => i.key === 'inss')!.amount).toBeGreaterThan(0);
  });
});

describe('calculateUnemploymentInsurance', () => {
  it('faixa 1: 80% da média', () => {
    const result = calculateUnemploymentInsurance(
      { lastThreeSalaries: [toCents(2100), toCents(2100), toCents(2100)], requestNumber: 1, monthsWorkedInPeriod: 12 },
      ruleSet2026_01
    );
    const installment = result.items.find((i) => i.key === 'installment')!;
    expect(installment.amount).toBe(Math.round(toCents(2100) * 0.8));
  });

  it('faixa 3: valor fixo do teto para médias altas', () => {
    const result = calculateUnemploymentInsurance(
      { lastThreeSalaries: [toCents(10000), toCents(10000), toCents(10000)], requestNumber: 1, monthsWorkedInPeriod: 24 },
      ruleSet2026_01
    );
    const installment = result.items.find((i) => i.key === 'installment')!;
    expect(installment.amount).toBe(ruleSet2026_01.unemploymentInsurance.ceiling);
  });

  it('parcela nunca fica abaixo do salário mínimo', () => {
    const result = calculateUnemploymentInsurance(
      { lastThreeSalaries: [toCents(1000), toCents(1000), toCents(1000)], requestNumber: 1, monthsWorkedInPeriod: 12 },
      ruleSet2026_01
    );
    const installment = result.items.find((i) => i.key === 'installment')!;
    expect(installment.amount).toBe(ruleSet2026_01.minimumWage);
  });

  it('1ª solicitação com 12 meses dá direito a 4 parcelas', () => {
    const result = calculateUnemploymentInsurance(
      { lastThreeSalaries: [toCents(1800), toCents(1800), toCents(1800)], requestNumber: 1, monthsWorkedInPeriod: 12 },
      ruleSet2026_01
    );
    const total = result.items.find((i) => i.key === 'total')!;
    const installment = result.items.find((i) => i.key === 'installment')!;
    expect(total.amount).toBe(installment.amount * 4);
  });
});
