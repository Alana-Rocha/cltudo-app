import { toReais, type Cents } from './money';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatCurrency(cents: Cents): string {
  return brl.format(toReais(cents));
}

export function formatDecimal(value: number, fractionDigits = 2): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatPercent(rate: number, fractionDigits = 1): string {
  return `${formatDecimal(rate * 100, fractionDigits)}%`;
}
