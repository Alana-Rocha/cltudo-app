import type { RuleSet } from '@/rules/schema';
import { add, clampToZero, min, multiply, subtract, type Cents } from '@/lib/money';
import type { Step } from './types';
import { formatDecimal, formatPercent } from '@/lib/format';

export type IrrfInput = {
  /** Taxable income for this calculation (salary, or 13º integral, etc). */
  taxableIncome: Cents;
  inss: Cents; // INSS already withheld on this same income
  dependents: number;
  alimony?: Cents; // pensão alimentícia
  otherLegalDeductions?: Cents;
};

export type IrrfResult = {
  total: Cents;
  base: Cents; // base actually used after choosing the more favorable deduction
  usedSimplifiedDiscount: boolean;
  taxBeforeReducer: Cents;
  reducerApplied: Cents; // how much the 2026 reducer subtracted
  bracketRate: number; // nominal rate of the bracket reached, before the reducer
  steps: Step[];
};

/**
 * Calculates IRRF on a single taxable income (rules 3.2). Callers must pass
 * each income (monthly salary, 13º integral, férias + 1/3) SEPARATELY —
 * never combine them — since each is taxed exclusively at source.
 */
export function calculateIrrf(input: IrrfInput, rules: RuleSet): IrrfResult {
  const alimony = input.alimony ?? 0;
  const otherLegalDeductions = input.otherLegalDeductions ?? 0;

  const legalDeductions = add(
    input.inss,
    multiply(rules.irrf.dependentDeduction, input.dependents),
    alimony,
    otherLegalDeductions
  );

  const baseWithLegalDeductions = clampToZero(subtract(input.taxableIncome, legalDeductions));
  const baseWithSimplifiedDiscount = clampToZero(
    subtract(input.taxableIncome, rules.irrf.simplifiedDiscount)
  );

  const usedSimplifiedDiscount = baseWithSimplifiedDiscount < baseWithLegalDeductions;
  const base = min(baseWithLegalDeductions, baseWithSimplifiedDiscount);

  const { tax: taxBeforeReducer, rate: bracketRate } = applyProgressiveTable(base, rules);
  const { finalTax, reducerApplied } = applyReducer(input.taxableIncome, taxBeforeReducer, rules);

  const steps: Step[] = [
    {
      label: 'Base de cálculo do IRRF',
      formula: usedSimplifiedDiscount
        ? `${formatDecimal(input.taxableIncome / 100, 2)} − ${formatDecimal(rules.irrf.simplifiedDiscount / 100, 2)} (desconto simplificado)`
        : `${formatDecimal(input.taxableIncome / 100, 2)} − ${formatDecimal(legalDeductions / 100, 2)} (INSS + dependentes + pensão + outras)`,
      value: base,
    },
    {
      label: 'IRRF pela tabela progressiva',
      formula: `${formatDecimal(base / 100, 2)} × ${formatPercent(bracketRate, 1)} − parcela a deduzir`,
      value: taxBeforeReducer,
    },
  ];
  if (reducerApplied > 0) {
    steps.push({
      label: 'Redutor da reforma do IR (vigente a partir de 2026)',
      formula:
        input.taxableIncome <= rules.irrf.reducer.fullExemptionUpTo
          ? `Rendimento até ${formatDecimal(rules.irrf.reducer.fullExemptionUpTo / 100, 2)}: imposto zerado`
          : `${formatDecimal(rules.irrf.reducer.phaseOutConstant / 100, 2)} − ${formatDecimal(rules.irrf.reducer.phaseOutRate, 6)} × ${formatDecimal(input.taxableIncome / 100, 2)}`,
      value: -reducerApplied,
    });
  }

  return {
    total: finalTax,
    base,
    usedSimplifiedDiscount,
    taxBeforeReducer,
    reducerApplied,
    bracketRate,
    steps,
  };
}

function applyProgressiveTable(base: Cents, rules: RuleSet): { tax: Cents; rate: number } {
  // Brackets here use the "base × rate − parcela a deduzir" shortcut form,
  // so we only need the single bracket the base falls into.
  for (const bracket of rules.irrf.brackets) {
    if (bracket.upTo === null || base <= bracket.upTo) {
      const tax = clampToZero(subtract(multiply(base, bracket.rate), bracket.deduction));
      return { tax, rate: bracket.rate };
    }
  }
  const last = rules.irrf.brackets[rules.irrf.brackets.length - 1];
  if (!last) return { tax: 0, rate: 0 };
  return { tax: clampToZero(subtract(multiply(base, last.rate), last.deduction)), rate: last.rate };
}

/**
 * Monthly reduction from Lei 15.270/2025: tax is zeroed up to
 * `fullExemptionUpTo`; up to `phaseOutUpTo` the reduction is
 * `phaseOutConstant − phaseOutRate × rendimento tributável`, never more than
 * the tax itself.
 */
function applyReducer(
  taxableIncome: Cents,
  taxBeforeReducer: Cents,
  rules: RuleSet
): { finalTax: Cents; reducerApplied: Cents } {
  const { fullExemptionUpTo, phaseOutUpTo, phaseOutConstant, phaseOutRate } = rules.irrf.reducer;

  if (taxableIncome <= fullExemptionUpTo) {
    return { finalTax: 0, reducerApplied: taxBeforeReducer };
  }
  if (taxableIncome > phaseOutUpTo) {
    return { finalTax: taxBeforeReducer, reducerApplied: 0 };
  }

  const reduction = clampToZero(subtract(phaseOutConstant, multiply(taxableIncome, phaseOutRate)));
  const reducerApplied = min(reduction, taxBeforeReducer);
  return { finalTax: subtract(taxBeforeReducer, reducerApplied), reducerApplied };
}

/**
 * Standalone entry point for the IRRF calculator page (Fase 3): wraps
 * calculateIrrf into the standard CalculationResult contract.
 */
export function calculateIrrfStandalone(input: IrrfInput, rules: RuleSet): import('./types').CalculationResult {
  const result = calculateIrrf(input, rules);
  return {
    items: [
      { key: 'income', label: 'Rendimento tributável', amount: input.taxableIncome, type: 'earning', explanation: 'Valor informado' },
      { key: 'irrf', label: 'IRRF', amount: result.total, type: 'deduction', explanation: result.usedSimplifiedDiscount ? 'Calculado com desconto simplificado' : 'Calculado com deduções legais (INSS + dependentes + pensão)' },
    ],
    totals: { gross: input.taxableIncome, deductions: result.total, net: input.taxableIncome - result.total },
    steps: result.steps,
    included: [],
    excluded: [],
    warnings: result.reducerApplied > 0 ? [`Redutor da reforma de 2026 aplicado: redução de ${formatDecimal(result.reducerApplied / 100, 2)} sobre o imposto apurado pela tabela.`] : [],
    rulesVersion: rules.id,
  };
}
