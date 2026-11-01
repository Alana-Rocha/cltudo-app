import { describe, expect, it } from 'vitest';
import { calculateTermination, projectedContractEnd, type TerminationInput } from '../termination';
import { compareTermination, latePaymentFine, terminationDeadlines } from '../terminationCheck';
import { ruleSet2026_01 } from '@/rules/2026-01';
import { toCents } from '@/lib/money';

const utc = (year: number, month: number, day: number) => new Date(Date.UTC(year, month - 1, day));

// Admissão 01/03/2024, saída 15/06/2026, sem justa causa, aviso indenizado de 36 dias, saldo do FGTS de R$ 10.000.
const input: TerminationInput = {
  admissionDate: utc(2024, 3, 1),
  terminationDate: utc(2026, 6, 15),
  grossSalary: toCents(3000),
  terminationType: 'without_cause',
  noticeMode: 'indemnified',
  dependents: 0,
  daysWorkedInLastMonth: 15,
  actualFgtsBalance: toCents(10000),
};
const due = calculateTermination(input, ruleSet2026_01);
// Saldo 1.500 + aviso 3.600 + 13º 1.750 + férias 1.250 + 1/3 416,67 − INSS 112,50 − INSS 13º 133,19 = 8.270,98
const TRCT_NET = toCents(8270.98);

describe('compareTermination', () => {
  it('o total do TRCT não inclui a multa do FGTS, que vai para a conta do FGTS', () => {
    const check = compareTermination(due, { net: TRCT_NET });
    expect(check.rows.find((row) => row.key === 'net')).toMatchObject({ due: TRCT_NET, status: 'ok' });
    expect(check.totalShortfall).toBe(0);
  });

  it('aponta a verba paga a menos e quanto falta', () => {
    const check = compareTermination(due, { balance: toCents(1500), vacation: toCents(1000) });
    const vacation = check.rows.find((row) => row.key === 'vacation')!;
    expect(vacation).toMatchObject({ due: toCents(1666.67), status: 'short', shortfall: toCents(666.67) });
    expect(check.totalShortfall).toBe(toCents(666.67));
  });

  it('desconto a mais de INSS também é dinheiro faltando', () => {
    const check = compareTermination(due, { inss: toCents(300) });
    expect(check.rows.find((row) => row.key === 'inss')).toMatchObject({ status: 'short', shortfall: toCents(54.31) });
  });

  it('diferença de centavos é arredondamento, não erro', () => {
    const check = compareTermination(due, { thirteenth: toCents(1749.5) });
    expect(check.rows.find((row) => row.key === 'thirteenth')!.status).toBe('ok');
    expect(check.totalShortfall).toBe(0);
  });

  it('com o total líquido informado, ele resume o TRCT (não soma as verbas de novo)', () => {
    const check = compareTermination(due, { net: TRCT_NET - toCents(500), balance: toCents(1000) });
    expect(check.totalShortfall).toBe(toCents(500));
  });

  it('soma a multa do FGTS paga a menos ao que falta no TRCT', () => {
    // Multa: 40% de 10.000 = 4.000
    const check = compareTermination(due, { net: TRCT_NET, fgtsFine: toCents(2000) });
    expect(check.totalShortfall).toBe(toCents(2000));
  });

  it('recebeu a mais aparece como diferença negativa', () => {
    const check = compareTermination(due, { balance: toCents(2000) });
    expect(check.rows.find((row) => row.key === 'balance')).toMatchObject({ status: 'over', shortfall: toCents(-500) });
  });

  it('não oferece aviso indenizado nem multa do FGTS num pedido de demissão', () => {
    const resignation = calculateTermination({ ...input, terminationType: 'employee_resignation', noticeMode: 'worked' }, ruleSet2026_01);
    const keys = compareTermination(resignation, {}).rows.map((row) => row.key);
    expect(keys).not.toContain('notice');
    expect(keys).not.toContain('fgtsFine');
  });
});

describe('terminationDeadlines', () => {
  const projectedEndDate = projectedContractEnd(input, ruleSet2026_01);

  it('o aviso indenizado projeta o fim do contrato: 15/06/2026 + 36 dias = 21/07/2026', () => {
    expect(projectedEndDate).toEqual(utc(2026, 7, 21));
  });

  it('pagamento em 10 dias, seguro-desemprego do 7º ao 120º dia e 2 anos para reclamar', () => {
    const deadlines = terminationDeadlines({ terminationDate: input.terminationDate, projectedEndDate, terminationType: 'without_cause' });
    expect(deadlines.find((d) => d.key === 'payment')!.until).toEqual(utc(2026, 6, 25));
    expect(deadlines.find((d) => d.key === 'unemployment-insurance')).toMatchObject({ from: utc(2026, 6, 22), until: utc(2026, 10, 13) });
    expect(deadlines.find((d) => d.key === 'lawsuit')!.until).toEqual(utc(2028, 7, 21));
  });

  it('pedido de demissão não tem seguro-desemprego', () => {
    const deadlines = terminationDeadlines({ terminationDate: input.terminationDate, projectedEndDate, terminationType: 'employee_resignation' });
    expect(deadlines.map((d) => d.key)).toEqual(['payment', 'lawsuit']);
  });
});

describe('latePaymentFine', () => {
  it('pago no último dia do prazo: sem multa', () => {
    expect(latePaymentFine({ terminationDate: utc(2026, 6, 15), paymentDate: utc(2026, 6, 25), grossSalary: toCents(3000) }).fine).toBe(0);
  });

  it('pago depois do prazo: multa de um salário', () => {
    const late = latePaymentFine({ terminationDate: utc(2026, 6, 15), paymentDate: utc(2026, 6, 30), grossSalary: toCents(3000) });
    expect(late).toMatchObject({ daysLate: 5, fine: toCents(3000) });
  });
});
