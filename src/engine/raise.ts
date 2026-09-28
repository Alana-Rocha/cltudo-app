import type { RuleSet } from '@/rules/schema';
import { subtract, type Cents } from '@/lib/money';
import { formatCurrency, formatPercent } from '@/lib/format';
import { calculateSalary } from './salary';
import type { CalculationResult } from './types';

export type RaiseInput = {
  currentGross: Cents;
  newGross: Cents;
  dependents: number;
};

// Above this share of the raise lost to INSS + IRRF, explain why.
const HIGH_MARGINAL_RATE = 0.35;

export function calculateRaise(input: RaiseInput, rules: RuleSet): CalculationResult {
  const before = calculateSalary({ grossSalary: input.currentGross, dependents: input.dependents }, rules);
  const after = calculateSalary({ grossSalary: input.newGross, dependents: input.dependents }, rules);

  const grossRaise = subtract(input.newGross, input.currentGross);
  const netRaise = subtract(after.totals.net, before.totals.net);
  const lostToTaxes = subtract(grossRaise, netRaise);
  const lostShare = grossRaise > 0 ? lostToTaxes / grossRaise : 0;

  const item = (r: CalculationResult, key: string) => r.items.find((i) => i.key === key)?.amount ?? 0;
  const inssDelta = subtract(item(after, 'inss'), item(before, 'inss'));
  const irrfDelta = subtract(item(after, 'irrf'), item(before, 'irrf'));

  const warnings: string[] = [];
  const { fullExemptionUpTo, phaseOutUpTo } = rules.irrf.reducer;
  if (lostShare > HIGH_MARGINAL_RATE && input.newGross > fullExemptionUpTo && input.currentGross < phaseOutUpTo) {
    warnings.push(
      `${formatPercent(lostShare, 0)} do aumento fica em descontos. Entre ${formatCurrency(fullExemptionUpTo)} e ${formatCurrency(phaseOutUpTo)} a redução do Imposto de Renda diminui conforme o salário sobe, então cada real a mais paga IRRF pela tabela e ainda perde parte da redução.`
    );
  }

  return {
    items: [
      { key: 'gross-raise', label: 'Aumento bruto', amount: grossRaise, type: 'earning', explanation: `${formatCurrency(input.currentGross)} → ${formatCurrency(input.newGross)}` },
      { key: 'inss-delta', label: 'INSS a mais', amount: inssDelta, type: 'deduction', explanation: 'Diferença do desconto de INSS' },
      { key: 'irrf-delta', label: 'IRRF a mais', amount: irrfDelta, type: 'deduction', explanation: 'Diferença do desconto de IRRF' },
      { key: 'net-before', label: 'Líquido atual', amount: before.totals.net, type: 'info', explanation: 'Antes do aumento' },
      { key: 'net-after', label: 'Líquido com aumento', amount: after.totals.net, type: 'info', explanation: `De cada R$ 100 de aumento, ficam ${formatCurrency(Math.round((1 - lostShare) * 10000))} no bolso` },
    ],
    totals: { gross: grossRaise, deductions: lostToTaxes, net: netRaise },
    steps: [
      { label: 'Líquido atual', formula: 'Bruto atual − INSS − IRRF', value: before.totals.net },
      { label: 'Líquido com aumento', formula: 'Novo bruto − INSS − IRRF', value: after.totals.net },
      { label: 'Aumento líquido', formula: 'Líquido com aumento − líquido atual', value: netRaise },
    ],
    included: [],
    excluded: [],
    warnings,
    rulesVersion: rules.id,
  };
}
