import { describe, it, expect } from 'vitest';
import { maskBrCurrencyInput } from '../money';

describe('maskBrCurrencyInput — máscara automática de valores em R$', () => {
  it('trata os dígitos digitados como centavos', () => {
    expect(maskBrCurrencyInput('1')).toBe('0,01');
    expect(maskBrCurrencyInput('12')).toBe('0,12');
    expect(maskBrCurrencyInput('123')).toBe('1,23');
    expect(maskBrCurrencyInput('123456')).toBe('1.234,56');
  });

  it('ignora caracteres não numéricos digitados pelo usuário', () => {
    expect(maskBrCurrencyInput('R$ 1.234,56')).toBe('1.234,56');
  });

  it('campo vazio permanece vazio', () => {
    expect(maskBrCurrencyInput('')).toBe('');
  });

  it('ignora zeros à esquerda', () => {
    expect(maskBrCurrencyInput('000123')).toBe('1,23');
  });
});
