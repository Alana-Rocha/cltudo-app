import type { RuleSet } from '@/rules/schema';
import { divide, multiply, type Cents } from '@/lib/money';
import type { CalculationResult } from './types';

export type CompTimeInput = {
  grossSalary: Cents;
  monthlyHours?: number;
  balanceHours: number; // saldo positivo (crédito) ou negativo (débito) de horas
  /** Se o saldo positivo não puder ser compensado (ex.: fim de contrato), paga-se como horas extras. */
  payOutRate?: number; // padrão: 0.5 (50%), igual à hora extra comum
};

/**
 * Banco de horas (CLT art. 59, §2º). Um saldo positivo não compensado
 * dentro do período do acordo (normalmente 6 meses, ou 1 ano por acordo
 * coletivo) deve ser pago como hora extra. Esta calculadora mostra o valor
 * do saldo se ele tiver de ser pago em dinheiro.
 */
export function calculateCompTime(input: CompTimeInput, rules: RuleSet): CalculationResult {
  const monthlyHours = input.monthlyHours ?? rules.overtime.defaultMonthlyHours;
  const hourlyRate = divide(input.grossSalary, Math.round(monthlyHours));
  const payOutRate = input.payOutRate ?? 0.5;

  const isCredit = input.balanceHours >= 0;
  const payoutValue = isCredit ? multiply(hourlyRate, Math.abs(input.balanceHours) * (1 + payOutRate)) : 0;

  return {
    items: [
      {
        key: 'balance',
        label: isCredit ? 'Saldo de horas a favor do empregado' : 'Saldo de horas devidas pelo empregado',
        amount: 0,
        type: 'info',
        explanation: `${Math.abs(input.balanceHours)}h`,
      },
      ...(isCredit
        ? [{ key: 'payout', label: `Valor se pago como hora extra (${(payOutRate * 100).toFixed(0)}%)`, amount: payoutValue, type: 'earning' as const, explanation: `${(hourlyRate / 100).toFixed(2)} × (1 + ${(payOutRate * 100).toFixed(0)}%) × ${Math.abs(input.balanceHours)}h`, legalBasis: 'CLT art. 59, §2º' }]
        : []),
    ],
    totals: { gross: payoutValue, deductions: 0, net: payoutValue },
    steps: [{ label: 'Valor-hora', formula: `${(input.grossSalary / 100).toFixed(2)} ÷ ${monthlyHours}h`, value: hourlyRate }],
    included: [],
    excluded: [],
    warnings: isCredit
      ? ['Um saldo positivo só vira pagamento em dinheiro se não puder mais ser compensado em folga (ex.: fim do período do acordo ou do contrato).']
      : ['Saldo negativo: normalmente compensado com horas trabalhadas a mais, não descontado do salário, salvo previsão diferente no acordo.'],
    rulesVersion: rules.id,
  };
}
