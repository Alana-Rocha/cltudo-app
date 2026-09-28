import { z } from 'zod';

/**
 * A progressive bracket. `upTo` is the upper bound of this bracket in cents
 * (null = no ceiling, i.e. the last/top bracket). `rate` is 0..1.
 * `deduction` is the "parcela a deduzir" in cents, used by the shortcut
 * formula: tax = base * rate - deduction (equivalent to the bracket-by-bracket sum).
 */
export const bracketSchema = z.object({
  upTo: z.number().int().positive().nullable(),
  rate: z.number().min(0).max(1),
  deduction: z.number().int().min(0),
});

export type Bracket = z.infer<typeof bracketSchema>;

function bracketsAreContinuousAndAscending(brackets: Bracket[]): boolean {
  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i];
    if (!b) return false;
    if (i < brackets.length - 1 && b.upTo === null) return false; // only last may be null
    if (i > 0) {
      const prev = brackets[i - 1];
      if (!prev) return false;
      if (b.rate <= prev.rate) return false; // strictly increasing rates
      if (prev.upTo !== null && b.upTo !== null && b.upTo <= prev.upTo) return false;
    }
  }
  return true;
}

const bracketsSchema = z
  .array(bracketSchema)
  .min(1)
  .refine(bracketsAreContinuousAndAscending, {
    message: 'Brackets must be continuous, ascending, and only the last may have upTo=null',
  });

export const ruleSetSchema = z
  .object({
    id: z.string().min(1),
    effectiveFrom: z.string().date(),
    sources: z.array(z.string().min(1)).min(1),
    minimumWage: z.number().int().positive(),
    inss: z.object({
      brackets: bracketsSchema,
      ceiling: z.number().int().positive(),
    }),
    irrf: z.object({
      brackets: bracketsSchema,
      dependentDeduction: z.number().int().min(0),
      simplifiedDiscount: z.number().int().min(0),
      reducer: z.object({
        fullExemptionUpTo: z.number().int().min(0),
        phaseOutUpTo: z.number().int().min(0),
        phaseOutConstant: z.number().int().min(0),
        phaseOutRate: z.number().min(0).max(1),
      }),
    }),
    fgts: z.object({
      monthlyRate: z.number().min(0).max(1),
      apprenticeRate: z.number().min(0).max(1),
      fineRates: z.object({
        withoutCause: z.number().min(0).max(1),
        agreement: z.number().min(0).max(1),
      }),
      withdrawalRates: z.object({
        withoutCause: z.number().min(0).max(1),
        agreement: z.number().min(0).max(1),
      }),
    }),
    salary: z.object({
      transportVoucherMaxRate: z.number().min(0).max(1),
    }),
    thirteenth: z.object({
      minDaysForMonth: z.number().int().min(1).max(30),
      firstInstallmentRate: z.number().min(0).max(1),
    }),
    vacation: z.object({
      bonusFraction: z.number().min(0).max(1),
      maxSoldFraction: z.number().min(0).max(1),
      split: z.object({
        maxPeriods: z.number().int().min(1),
        minLongestDays: z.number().int().min(1),
        minOtherDays: z.number().int().min(1),
      }),
      absenceScale: z.array(
        z.object({
          minAbsences: z.number().int().min(0),
          maxAbsences: z.number().int().min(0).nullable(),
          days: z.number().int().min(0).max(30),
        })
      ),
      minDaysForMonth: z.number().int().min(1).max(30),
    }),
    overtime: z.object({
      defaultMonthlyHours: z.number().positive(),
      defaultRates: z.array(z.number().min(0)).min(1),
    }),
    notice: z.object({
      baseDays: z.number().int().positive(),
      daysPerYear: z.number().int().min(0),
      maxDays: z.number().int().positive(),
      employeeResignationDays: z.number().int().positive(),
    }),
    nightShift: z.object({
      additionalRate: z.number().min(0).max(1), // adicional noturno, ex.: 0.20
      reducedHourMinutes: z.number().positive(), // hora noturna reduzida, ex.: 52.5
    }),
    unhealthiness: z.object({
      rates: z.object({ low: z.number().min(0).max(1), medium: z.number().min(0).max(1), high: z.number().min(0).max(1) }),
    }),
    hazardPay: z.object({ rate: z.number().min(0).max(1) }),
    unemploymentInsurance: z.object({
      tier1UpTo: z.number().int().positive(), // faixa 1: multiplica-se por tier1Rate
      tier1Rate: z.number().min(0).max(1),
      tier2UpTo: z.number().int().positive(), // faixa 2: tier2Base + tier2Rate sobre o excedente de tier1UpTo
      tier2Base: z.number().int().min(0),
      tier2Rate: z.number().min(0).max(1),
      ceiling: z.number().int().positive(), // faixa 3: valor fixo (teto)
      installmentsBySeniority: z.array(
        z.object({ requestNumber: z.number().int().min(1), minMonths: z.number().int().min(0), installments: z.number().int().min(0) })
      ),
    }),
  })
  .refine((rs) => rs.inss.ceiling > rs.minimumWage, {
    message: 'INSS ceiling must be greater than the minimum wage',
    path: ['inss', 'ceiling'],
  })
  .refine((rs) => rs.irrf.reducer.fullExemptionUpTo <= rs.irrf.reducer.phaseOutUpTo, {
    message: 'reducer.fullExemptionUpTo must be <= reducer.phaseOutUpTo',
    path: ['irrf', 'reducer', 'phaseOutUpTo'],
  });

export type RuleSet = z.infer<typeof ruleSetSchema>;

const ruleSetsFileSchema = z.array(ruleSetSchema).min(1).refine(
  (sets) => new Set(sets.map((s) => s.effectiveFrom)).size === sets.length,
  { message: 'Each ruleSet must have a unique effectiveFrom' }
);

/** Validates a raw JSON payload (remote or fallback) into a list of RuleSet. */
export function parseRuleSets(raw: unknown): RuleSet[] {
  return ruleSetsFileSchema.parse(raw);
}
