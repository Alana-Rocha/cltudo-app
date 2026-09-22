import type { RuleSet } from '@/rules/schema';
import { add, clampToZero, min, multiply, subtract, type Cents } from '@/lib/money';
import type { Step } from './types';

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
        ? `${(input.taxableIncome / 100).toFixed(2)} − ${(rules.irrf.simplifiedDiscount / 100).toFixed(2)} (desconto simplificado)`
        : `${(input.taxableIncome / 100).toFixed(2)} − ${(legalDeductions / 100).toFixed(2)} (INSS + dependentes + pensão + outras)`,
      value: base,
    },
    {
      label: 'IRRF pela tabela progressiva',
      formula: `${(base / 100).toFixed(2)} × ${(bracketRate * 100).toFixed(1)}% − parcela a deduzir`,
      value: taxBeforeReducer,
    },
  ];
  if (reducerApplied > 0) {
    steps.push({
      label: 'Redutor da reforma do IR (vigente a partir de 2026)',
      formula: `Redução aplicada sobre o imposto apurado`,
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
 * Applies the 2026 reform's monthly reducer (Lei 15.270/2025): full
 * exemption up to `fullExemptionUpTo`, linearly phasing out to no reduction
 * at `phaseOutUpTo`.
 *
 * VERIFY (Fase 1 §4, item 4): the exact phase-out formula was not confirmed
 * against a primary source. This implementation uses a standard continuous
 * linear phase-out (0% reduction at phaseOutUpTo, 100% at fullExemptionUpTo)
 * so behavior is at least continuous and monotonic; confirm against the
 * official formula before relying on this for real payroll amounts.
 */
function applyReducer(
  taxableIncome: Cents,
  taxBeforeReducer: Cents,
  rules: RuleSet
): { finalTax: Cents; reducerApplied: Cents } {
  const { fullExemptionUpTo, phaseOutUpTo } = rules.irrf.reducer;

  if (taxableIncome <= fullExemptionUpTo) {
    return { finalTax: 0, reducerApplied: taxBeforeReducer };
  }
  if (taxableIncome >= phaseOutUpTo || phaseOutUpTo <= fullExemptionUpTo) {
    return { finalTax: taxBeforeReducer, reducerApplied: 0 };
  }

  const progress = (taxableIncome - fullExemptionUpTo) / (phaseOutUpTo - fullExemptionUpTo);
  const finalTax = Math.round(taxBeforeReducer * progress);
  return { finalTax, reducerApplied: subtract(taxBeforeReducer, finalTax) };
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
    warnings: result.reducerApplied > 0 ? [`Redutor da reforma de 2026 aplicado: redução de ${(result.reducerApplied / 100).toFixed(2)} sobre o imposto apurado pela tabela.`] : [],
    rulesVersion: rules.id,
  };
}
