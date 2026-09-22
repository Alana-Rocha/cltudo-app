import { describe, it, expect } from 'vitest';
import { calculateTermination } from '../termination';
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
});
