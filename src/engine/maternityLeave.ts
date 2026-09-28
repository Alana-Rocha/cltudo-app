import type { RuleSet } from '@/rules/schema';
import { add, multiply, subtract, type Cents } from '@/lib/money';
import { calculateInss } from './inss';
import { calculateIrrf } from './irrf';
import type { CalculationResult } from './types';
import { formatDecimal } from '@/lib/format';

export type MaternityLeaveInput = {
  /** Remuneração integral (empregada CLT) ou média de contribuições (outras categorias) — ver avisos. */
  monthlyAmount: Cents;
  extendedProgram?: boolean; // Programa Empresa Cidadã: 180 dias em vez de 120
  dependents?: number;
};

/**
 * Salário-maternidade (Lei 8.213/1991, arts. 71-73) para empregada CLT: a
 * remuneração integral, sem o teto do INSS. Pago por 120 dias, ou 180 dias
 * em empresas do Programa Empresa Cidadã.
 *
 * Descontos como a folha aplica hoje, mês a mês: INSS da empregada (o
 * benefício é salário-de-contribuição, Lei 8.212/1991 art. 28 §2º — tese
 * pendente no STF, Tema 1274) e IRRF (não isento, art. 48 da Lei
 * 8.541/1992 não o alcança — SC Disit/SRRF04 nº 4021/2021).
 */
export function calculateMaternityLeave(input: MaternityLeaveInput, rules: RuleSet): CalculationResult {
  const days = input.extendedProgram ? 180 : 120;
  const months = days / 30;

  const inss = calculateInss(input.monthlyAmount, rules);
  const irrf = calculateIrrf(
    { taxableIncome: input.monthlyAmount, inss: inss.total, dependents: input.dependents ?? 0 },
    rules
  );
  const monthlyNet = subtract(input.monthlyAmount, add(inss.total, irrf.total));

  const gross = multiply(input.monthlyAmount, months);
  const deductions = multiply(add(inss.total, irrf.total), months);
  const net = multiply(monthlyNet, months);

  return {
    items: [
      { key: 'monthly', label: 'Valor mensal do benefício', amount: input.monthlyAmount, type: 'earning', explanation: 'Remuneração integral (empregada CLT)', legalBasis: 'Lei 8.213/1991, arts. 71-73' },
      { key: 'inss', label: 'INSS por mês', amount: inss.total, type: 'deduction', explanation: 'Contribuição da empregada', legalBasis: 'Lei 8.212/1991, art. 28, §2º' },
      { key: 'irrf', label: 'IRRF por mês', amount: irrf.total, type: 'deduction', explanation: irrf.usedSimplifiedDiscount ? 'Calculado com desconto simplificado' : 'Calculado com deduções legais' },
      { key: 'monthly-net', label: 'Valor líquido por mês', amount: monthlyNet, type: 'info', explanation: 'Benefício − INSS − IRRF' },
      { key: 'total', label: `Total bruto no período (${days} dias)`, amount: gross, type: 'info', explanation: `${formatDecimal(input.monthlyAmount / 100, 2)} × ${months} meses` },
    ],
    totals: { gross, deductions, net },
    steps: [
      ...inss.steps,
      ...irrf.steps,
      { label: `Total líquido (${months} meses)`, formula: `${formatDecimal(monthlyNet / 100, 2)} × ${months}`, value: net },
    ],
    included: [],
    excluded: [],
    warnings: [
      'O desconto de INSS da empregada sobre o salário-maternidade é o que a folha aplica hoje, mas a cobrança está em discussão no STF (Tema 1274). Se o STF afastá-la, o valor líquido aumenta.',
      'Para outras categorias (doméstica, contribuinte individual, MEI, segurada especial), a base de cálculo é diferente — consulte a calculadora apenas como referência para empregadas CLT.',
    ],
    rulesVersion: rules.id,
  };
}
