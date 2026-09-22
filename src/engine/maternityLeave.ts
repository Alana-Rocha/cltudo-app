import type { RuleSet } from '@/rules/schema';
import { multiply, type Cents } from '@/lib/money';
import type { CalculationResult } from './types';

export type MaternityLeaveInput = {
  /** Remuneração integral (empregada CLT) ou média de contribuições (outras categorias) — ver avisos. */
  monthlyAmount: Cents;
  extendedProgram?: boolean; // Programa Empresa Cidadã: 180 dias em vez de 120
};

/**
 * Salário-maternidade (Lei 8.213/1991, arts. 71-73) para empregada CLT: a
 * remuneração integral, sem o teto do INSS (só o teto constitucional do
 * subsídio de ministro do STF, que na prática não limita a maioria dos
 * casos). Pago por 120 dias, ou 180 dias em empresas do Programa Empresa
 * Cidadã.
 *
 * IMPORTANTE: este cálculo NÃO aplica INSS/IRRF sobre o benefício — o
 * tratamento tributário exato do salário-maternidade (se e como retém
 * IRRF, quem faz a retenção) não foi confirmado nesta pesquisa e varia
 * conforme quem paga o benefício (empresa vs. INSS direto). Trate o valor
 * abaixo como bruto e confirme a tributação com um contador antes de
 * declarar ou descontar algo.
 */
export function calculateMaternityLeave(input: MaternityLeaveInput, rules: RuleSet): CalculationResult {
  const days = input.extendedProgram ? 180 : 120;
  const months = days / 30;
  const total = multiply(input.monthlyAmount, months);

  return {
    items: [
      { key: 'monthly', label: 'Valor mensal do benefício', amount: input.monthlyAmount, type: 'earning', explanation: 'Remuneração integral (empregada CLT)', legalBasis: 'Lei 8.213/1991, arts. 71-73' },
      { key: 'total', label: `Total no período (${days} dias)`, amount: total, type: 'earning', explanation: `${(input.monthlyAmount / 100).toFixed(2)} × ${months} meses` },
    ],
    totals: { gross: total, deductions: 0, net: total },
    steps: [{ label: 'Total do benefício', formula: `${(input.monthlyAmount / 100).toFixed(2)} × ${months}`, value: total }],
    included: [],
    excluded: [],
    warnings: [
      'Este valor é o bruto do benefício, para empregada CLT. Não inclui eventual desconto de INSS/IRRF, cujo tratamento exato não foi confirmado nesta calculadora — confirme com a empresa, o INSS ou um contador.',
      'Para outras categorias (doméstica, contribuinte individual, MEI, segurada especial), a base de cálculo é diferente — consulte a calculadora apenas como referência para empregadas CLT.',
    ],
    rulesVersion: rules.id,
  };
}
