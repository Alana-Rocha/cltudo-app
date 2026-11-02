import { describe, it, expect } from 'vitest';
import { calculateTermination, projectedContractEnd, type TerminationInput } from '../termination';
import type { CalculationResult } from '../types';
import { ruleSet2026_01 } from '@/rules/2026-01';
import { toCents } from '@/lib/money';

const admission = new Date(Date.UTC(2024, 0, 10)); // 10 Jan 2024 — a little under 2 years by end of 2025

describe('calculateTermination — matriz de verbas', () => {
  it('sem justa causa: aviso indenizado projeta a data, 13º e FGTS (multa 40%) são devidos', () => {
    const result = calculateTermination(
      {
        admissionDate: admission,
        terminationDate: new Date(Date.UTC(2025, 11, 20)), // 20 Dec 2025
        grossSalary: toCents(3000),
        terminationType: 'without_cause',
        noticeMode: 'indemnified',
        dependents: 0,
        daysWorkedInLastMonth: 20,
      },
      ruleSet2026_01
    );
    expect(result.items.some((i) => i.key === 'notice' && i.amount > 0)).toBe(true);
    expect(result.included.some((s) => s.includes('Aviso prévio indenizado'))).toBe(true);
    expect(result.included.some((s) => s.includes('Multa do FGTS: 40%'))).toBe(true);
  });

  it('justa causa: nenhum aviso, nenhum 13º, nenhuma multa de FGTS — só saldo e férias proporcionais', () => {
    const result = calculateTermination(
      {
        admissionDate: admission,
        terminationDate: new Date(Date.UTC(2025, 11, 20)),
        grossSalary: toCents(3000),
        terminationType: 'just_cause',
        noticeMode: 'waived_by_employer',
        dependents: 0,
        daysWorkedInLastMonth: 20,
      },
      ruleSet2026_01
    );
    const thirteenth = result.items.find((i) => i.key === 'thirteenth')!;
    expect(thirteenth.amount).toBe(0);
    expect(result.excluded.some((s) => s.includes('13º proporcional'))).toBe(true);
    expect(result.excluded.some((s) => s.includes('Multa do FGTS'))).toBe(true);
    expect(result.excluded.some((s) => s.includes('Saque do FGTS'))).toBe(true);
    // Férias proporcionais still due even on justa causa:
    const vacation = result.items.find((i) => i.key === 'vacation')!;
    expect(vacation.amount).toBeGreaterThan(0);
  });

  it('acordo (art. 484-A): aviso pela metade, multa de FGTS 20%, saque até 80%', () => {
    const result = calculateTermination(
      {
        admissionDate: admission,
        terminationDate: new Date(Date.UTC(2025, 11, 20)),
        grossSalary: toCents(3000),
        terminationType: 'agreement',
        noticeMode: 'indemnified',
        dependents: 0,
        daysWorkedInLastMonth: 20,
      },
      ruleSet2026_01
    );
    expect(result.included.some((s) => s.includes('50% por acordo'))).toBe(true);
    expect(result.included.some((s) => s.includes('Multa do FGTS: 20%'))).toBe(true);
    expect(result.included.some((s) => s.includes('Saque do FGTS: 80%'))).toBe(true);
  });

  describe('acordo (art. 484-A): projeção do aviso pela metade ou inteira', () => {
    // 10/02/2025 a 20/10/2026, R$ 3.000, aviso de 33 dias: metade projeta até 06/11 e todos até 22/11.
    const agreement: TerminationInput = {
      admissionDate: new Date(Date.UTC(2025, 1, 10)),
      terminationDate: new Date(Date.UTC(2026, 9, 20)),
      grossSalary: toCents(3000),
      terminationType: 'agreement',
      noticeMode: 'indemnified',
      dependents: 0,
      daysWorkedInLastMonth: 20,
    };
    const amount = (result: CalculationResult, key: string) => result.items.find((i) => i.key === key)!.amount;

    it('por padrão projeta metade dos dias, arredondando para cima', () => {
      const result = calculateTermination(agreement, ruleSet2026_01);
      expect(projectedContractEnd(agreement, ruleSet2026_01)).toEqual(new Date(Date.UTC(2026, 10, 6)));
      expect(amount(result, 'thirteenth')).toBe(toCents(2500)); // 10/12
      expect(amount(result, 'vacation')).toBe(toCents(2250)); // 9/12
      expect(result.warnings.some((w) => w.includes('projeta metade dos dias'))).toBe(true);
    });

    it("com 'full' projeta todos os dias", () => {
      const full = { ...agreement, agreementProjection: 'full' as const };
      const result = calculateTermination(full, ruleSet2026_01);
      expect(projectedContractEnd(full, ruleSet2026_01)).toEqual(new Date(Date.UTC(2026, 10, 22)));
      expect(amount(result, 'thirteenth')).toBe(toCents(2750)); // 11/12
      expect(amount(result, 'vacation')).toBe(toCents(2500)); // 10/12
    });

    it('as duas leituras pagam o mesmo aviso, pela metade', () => {
      const half = calculateTermination(agreement, ruleSet2026_01);
      const full = calculateTermination({ ...agreement, agreementProjection: 'full' }, ruleSet2026_01);
      expect(amount(half, 'notice')).toBe(toCents(1650));
      expect(amount(full, 'notice')).toBe(toCents(1650));
    });
  });

  it('pedido de demissão sem cumprir aviso: desconto de até 30 dias', () => {
    const result = calculateTermination(
      {
        admissionDate: admission,
        terminationDate: new Date(Date.UTC(2025, 11, 20)),
        grossSalary: toCents(3000),
        terminationType: 'employee_resignation',
        noticeMode: 'not_fulfilled_by_employee',
        dependents: 0,
        daysWorkedInLastMonth: 20,
      },
      ruleSet2026_01
    );
    const notice = result.items.find((i) => i.key === 'notice')!;
    expect(notice.amount).toBeLessThan(0);
    expect(Math.abs(notice.amount)).toBe(toCents(3000)); // 30/30 dias = salário integral
  });

  it('férias vencidas: soma dias não gozados de período já vencido, com 1/3', () => {
    const result = calculateTermination(
      {
        admissionDate: admission,
        terminationDate: new Date(Date.UTC(2025, 11, 20)),
        grossSalary: toCents(3000),
        terminationType: 'without_cause',
        noticeMode: 'indemnified',
        dependents: 0,
        daysWorkedInLastMonth: 20,
        expiredVacationDays: 12,
      },
      ruleSet2026_01
    );
    const expired = result.items.find((i) => i.key === 'vacation-expired')!;
    // dailyRate = 3000/30 = 100; 12 dias = 1200 + 1/3 = 1600
    expect(expired.amount).toBe(toCents(1600));
    expect(result.included.some((s) => s.includes('Férias vencidas: 12 dia(s)'))).toBe(true);
  });

  it('férias vencidas em dobro: dobra o valor (principal + 1/3)', () => {
    const result = calculateTermination(
      {
        admissionDate: admission,
        terminationDate: new Date(Date.UTC(2025, 11, 20)),
        grossSalary: toCents(3000),
        terminationType: 'without_cause',
        noticeMode: 'indemnified',
        dependents: 0,
        daysWorkedInLastMonth: 20,
        expiredVacationDays: 12,
        expiredVacationDoubled: true,
      },
      ruleSet2026_01
    );
    const expired = result.items.find((i) => i.key === 'vacation-expired')!;
    expect(expired.amount).toBe(toCents(3200));
    expect(result.included.some((s) => s.includes('pagos em dobro'))).toBe(true);
  });

  it('sem férias vencidas informadas: nenhum item extra é adicionado', () => {
    const result = calculateTermination(
      {
        admissionDate: admission,
        terminationDate: new Date(Date.UTC(2025, 11, 20)),
        grossSalary: toCents(3000),
        terminationType: 'without_cause',
        noticeMode: 'indemnified',
        dependents: 0,
        daysWorkedInLastMonth: 20,
      },
      ruleSet2026_01
    );
    expect(result.items.some((i) => i.key === 'vacation-expired')).toBe(false);
  });

  it('média de variáveis entra no aviso, 13º e férias, mas não no saldo de salário', () => {
    const base = {
      admissionDate: new Date(Date.UTC(2025, 6, 1)),
      terminationDate: new Date(Date.UTC(2025, 11, 20)),
      grossSalary: toCents(3000),
      terminationType: 'without_cause' as const,
      noticeMode: 'indemnified' as const,
      dependents: 0,
      daysWorkedInLastMonth: 20,
    };
    const without = calculateTermination(base, ruleSet2026_01);
    const withAvg = calculateTermination({ ...base, averageVariables: toCents(600) }, ruleSet2026_01);
    const item = (r: typeof without, key: string) => r.items.find((i) => i.key === key)!.amount;

    expect(item(withAvg, 'balance')).toBe(item(without, 'balance'));
    expect(item(withAvg, 'notice')).toBe(toCents(3600)); // 30 dias × (3.000 + 600)
    expect(item(withAvg, 'thirteenth')).toBeGreaterThan(item(without, 'thirteenth'));
    expect(item(withAvg, 'vacation')).toBeGreaterThan(item(without, 'vacation'));
  });

  it('admissão há menos de 1 ano: aviso prévio é de 30 dias (sem acréscimo)', () => {
    const recentAdmission = new Date(Date.UTC(2025, 6, 1)); // 6 months before termination
    const result = calculateTermination(
      {
        admissionDate: recentAdmission,
        terminationDate: new Date(Date.UTC(2025, 11, 20)),
        grossSalary: toCents(3000),
        terminationType: 'without_cause',
        noticeMode: 'indemnified',
        dependents: 0,
        daysWorkedInLastMonth: 20,
      },
      ruleSet2026_01
    );
    const notice = result.items.find((i) => i.key === 'notice')!;
    expect(notice.amount).toBe(toCents(3000)); // 30 dias = 1 salário
  });

  it('férias proporcionais contam só o período aquisitivo em curso, não o contrato inteiro', () => {
    // Admissão 01/03/2024, saída 15/06/2026 + 36 dias de aviso = 21/07/2026. Período em curso começou em
    // 01/03/2026: março a junho completos + 21 dias de julho = 5/12 (CLT art. 146, parágrafo único).
    const result = calculateTermination(
      {
        admissionDate: new Date(Date.UTC(2024, 2, 1)),
        terminationDate: new Date(Date.UTC(2026, 5, 15)),
        grossSalary: toCents(3000),
        terminationType: 'without_cause',
        noticeMode: 'indemnified',
        dependents: 0,
        daysWorkedInLastMonth: 15,
      },
      ruleSet2026_01
    );
    const vacation = result.items.find((i) => i.key === 'vacation')!;
    expect(vacation.explanation).toBe('5/12 avos');
    expect(vacation.amount).toBe(toCents(1250));
    expect(result.items.find((i) => i.key === 'vacation-bonus')!.amount).toBe(toCents(416.67));
  });

  it('período aquisitivo completo na data projetada vale 12/12', () => {
    // Admissão 01/03/2025, saída 29/01/2026 + 30 dias de aviso = 28/02/2026: fecha o 1º período.
    const result = calculateTermination(
      {
        admissionDate: new Date(Date.UTC(2025, 2, 1)),
        terminationDate: new Date(Date.UTC(2026, 0, 29)),
        grossSalary: toCents(3000),
        terminationType: 'without_cause',
        noticeMode: 'indemnified',
        dependents: 0,
        daysWorkedInLastMonth: 29,
      },
      ruleSet2026_01
    );
    expect(result.items.find((i) => i.key === 'vacation')!.explanation).toBe('12/12 avos');
  });
});
