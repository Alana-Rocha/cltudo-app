import type { RuleSet } from './schema';

/**
 * FALLBACK rule set, effective 2026-01-01.
 *
 * IMPORTANT — values flagged "A VERIFICAR" in Fase 1 are marked below with a
 * `VERIFY:` comment. They come from convergent third-party sources found in
 * research, NOT from a primary source (Diário Oficial, Receita Federal,
 * INSS/Previdência) that could be fetched directly. Do not treat this file as
 * authoritative for production without confirming those values against the
 * official publication. This is exactly the situation `rules/index.ts`'s
 * remote-with-fallback design exists for: update this file (or better, the
 * remote JSON) the moment the official values are confirmed, without
 * touching the engine.
 */
export const ruleSet2026_01: RuleSet = {
  id: '2026-01',
  effectiveFrom: '2026-01-01',
  sources: [
    'Portaria Interministerial MPS/MF nº 13/2026 (INSS — citada por fontes secundárias, não confirmada em fonte primária)',
    'Lei nº 15.270/2025 (redutor mensal do IRRF)',
    'A VERIFICAR: tabela progressiva mensal do IRRF (Receita Federal) — valores abaixo vêm de fontes secundárias divergentes entre si',
  ],
  minimumWage: 162_100, // R$ 1.621,00

  inss: {
    brackets: [
      { upTo: 162_100, rate: 0.075, deduction: 0 },
      { upTo: 290_284, rate: 0.09, deduction: 2_366 },
      { upTo: 435_427, rate: 0.12, deduction: 11_075 },
      { upTo: null, rate: 0.14, deduction: 19_849 },
    ],
    ceiling: 847_555, // R$ 8.475,55
  },

  irrf: {
    // VERIFY: these are the brackets last confirmed in force (in effect since
    // May/2023, Lei 14.663/2023) and reproduced consistently by at least one
    // 2026 source's worked example (otimizapro.com, R$5.000 example). NOT
    // confirmed against a 2026 Receita Federal publication — third-party
    // sources found in research disagreed with each other on this table, so
    // treat these bracket cut-offs and deductions as placeholders until
    // checked against the official 2026 Instrução Normativa RFB.
    brackets: [
      { upTo: 225_920, rate: 0, deduction: 0 },
      { upTo: 282_665, rate: 0.075, deduction: 16_944 },
      { upTo: 375_105, rate: 0.15, deduction: 38_144 },
      { upTo: 466_468, rate: 0.225, deduction: 66_277 },
      { upTo: null, rate: 0.275, deduction: 89_600 },
    ],
    dependentDeduction: 18_959, // R$ 189,59
    simplifiedDiscount: 60_720, // R$ 607,20 — VERIFY: one source cited R$ 564,80 instead
    reducer: {
      fullExemptionUpTo: 500_000, // R$ 5.000,00 rendimento tributável
      phaseOutUpTo: 735_000, // R$ 7.350,00 — VERIFY exact phase-out formula, see engine/irrf.ts
    },
  },

  fgts: {
    monthlyRate: 0.08,
    apprenticeRate: 0.02,
    fineRates: { withoutCause: 0.4, agreement: 0.2 },
    withdrawalRates: { withoutCause: 1.0, agreement: 0.8 },
  },

  salary: {
    transportVoucherMaxRate: 0.06,
  },

  thirteenth: {
    minDaysForMonth: 15,
    firstInstallmentRate: 0.5,
  },

  vacation: {
    bonusFraction: 1 / 3,
    maxSoldFraction: 1 / 3, // up to 10 of 30 days
    split: { maxPeriods: 3, minLongestDays: 14, minOtherDays: 5 },
    // CLT art. 130 — days of vacation lost per number of unjustified absences
    // in the "período aquisitivo".
    absenceScale: [
      { minAbsences: 0, maxAbsences: 5, days: 30 },
      { minAbsences: 6, maxAbsences: 14, days: 24 },
      { minAbsences: 15, maxAbsences: 23, days: 18 },
      { minAbsences: 24, maxAbsences: 32, days: 12 },
      { minAbsences: 33, maxAbsences: null, days: 0 },
    ],
    minDaysForMonth: 15,
  },

  overtime: {
    defaultMonthlyHours: 220,
    defaultRates: [0.5, 1.0],
  },

  notice: {
    baseDays: 30,
    daysPerYear: 3,
    maxDays: 90,
    employeeResignationDays: 30,
  },

  nightShift: {
    additionalRate: 0.2, // CLT art. 73 — 20% para urbanos (pode ser maior por convenção coletiva)
    reducedHourMinutes: 52.5, // hora noturna reduzida: 52min30s
  },

  unhealthiness: {
    // CLT art. 192 — grau mínimo, médio e máximo. Base = salário mínimo,
    // salvo lei ou norma coletiva que fixe base diferente (Súmula
    // Vinculante 4/STF) — sinalizado no engine.
    rates: { low: 0.1, medium: 0.2, high: 0.4 },
  },

  hazardPay: {
    rate: 0.3, // CLT art. 193, §1º — 30% sobre o salário base (sem gratificações)
  },

  unemploymentInsurance: {
    // VERIFY: valores 2026 convergentes entre múltiplas fontes secundárias
    // (MTE, vigência 11/01/2026); não confirmados em fonte primária nesta
    // pesquisa.
    tier1UpTo: 222_217, // R$ 2.222,17
    tier1Rate: 0.8,
    tier2UpTo: 370_399, // R$ 3.703,99
    tier2Base: 177_774, // R$ 1.777,74
    tier2Rate: 0.5,
    ceiling: 251_865, // R$ 2.518,65
    installmentsBySeniority: [
      { requestNumber: 1, minMonths: 12, installments: 4 },
      { requestNumber: 1, minMonths: 24, installments: 5 },
      { requestNumber: 2, minMonths: 9, installments: 3 },
      { requestNumber: 2, minMonths: 12, installments: 4 },
      { requestNumber: 2, minMonths: 24, installments: 5 },
      { requestNumber: 3, minMonths: 6, installments: 3 },
      { requestNumber: 3, minMonths: 12, installments: 4 },
      { requestNumber: 3, minMonths: 24, installments: 5 },
    ],
  },
};
