import { describe, it, expect } from 'vitest';
import { countAvos, fullYearsBetween, addDays, maskBrDateInput } from '../dates';

describe('maskBrDateInput — máscara automática dd/mm/aaaa', () => {
  it('insere as barras conforme o usuário digita números', () => {
    expect(maskBrDateInput('0')).toBe('0');
    expect(maskBrDateInput('01')).toBe('01');
    expect(maskBrDateInput('011')).toBe('01/1');
    expect(maskBrDateInput('01012026')).toBe('01/01/2026');
  });

  it('ignora caracteres não numéricos digitados pelo usuário', () => {
    expect(maskBrDateInput('01/01/2026')).toBe('01/01/2026');
    expect(maskBrDateInput('ab01cd01ef2026')).toBe('01/01/2026');
  });

  it('trunca em 8 dígitos (ddmmaaaa)', () => {
    expect(maskBrDateInput('010120269999')).toBe('01/01/2026');
  });
});

describe('countAvos — regra dos 15 dias', () => {
  it('exatamente 15 dias no mês conta como avo inteiro', () => {
    const start = new Date(Date.UTC(2026, 0, 1)); // 1 Jan
    const end = new Date(Date.UTC(2026, 0, 15)); // 15 Jan — 15 days worked
    expect(countAvos(start, end, 15)).toBe(1);
  });

  it('14 dias no mês NÃO conta o avo', () => {
    const start = new Date(Date.UTC(2026, 0, 1));
    const end = new Date(Date.UTC(2026, 0, 14)); // 14 days worked
    expect(countAvos(start, end, 15)).toBe(0);
  });

  it('conta corretamente ao longo de vários meses completos', () => {
    const start = new Date(Date.UTC(2026, 0, 1));
    const end = new Date(Date.UTC(2026, 5, 30)); // Jan-Jun, all full months
    expect(countAvos(start, end, 15)).toBe(6);
  });

  it('nunca ultrapassa 12 avos', () => {
    const start = new Date(Date.UTC(2020, 0, 1));
    const end = new Date(Date.UTC(2026, 11, 31));
    expect(countAvos(start, end, 15)).toBe(12);
  });
});

describe('fullYearsBetween — admissão há menos de 1 ano', () => {
  it('menos de 1 ano completo retorna 0', () => {
    const admission = new Date(Date.UTC(2026, 0, 10));
    const reference = new Date(Date.UTC(2026, 8, 10)); // 8 months later
    expect(fullYearsBetween(admission, reference)).toBe(0);
  });

  it('exatamente 1 ano completo retorna 1', () => {
    const admission = new Date(Date.UTC(2025, 0, 10));
    const reference = new Date(Date.UTC(2026, 0, 10));
    expect(fullYearsBetween(admission, reference)).toBe(1);
  });

  it('um dia antes do aniversário de 1 ano retorna 0', () => {
    const admission = new Date(Date.UTC(2025, 0, 10));
    const reference = new Date(Date.UTC(2026, 0, 9));
    expect(fullYearsBetween(admission, reference)).toBe(0);
  });
});

describe('addDays — projeção do aviso virando mês/ano', () => {
  it('projeta corretamente virando o mês', () => {
    const start = new Date(Date.UTC(2026, 0, 25)); // 25 Jan
    const result = addDays(start, 30);
    expect(result.getUTCMonth()).toBe(1); // February
    expect(result.getUTCDate()).toBe(24);
  });

  it('projeta corretamente virando o ano', () => {
    const start = new Date(Date.UTC(2026, 11, 15)); // 15 Dec
    const result = addDays(start, 30);
    expect(result.getUTCFullYear()).toBe(2027);
    expect(result.getUTCMonth()).toBe(0); // January
  });
});
