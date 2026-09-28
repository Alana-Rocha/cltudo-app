import type { RuleSet } from './schema';

/**
 * FALLBACK rule set, effective 2026-01-01. INSS, IRRF and seguro-desemprego
 * values were checked against gov.br primary sources on 2026-09-27.
 */
export const ruleSet2026_01: RuleSet = {
  id: '2026-01',
  effectiveFrom: '2026-01-01',
  sources: [
    'Portaria Interministerial MPS/MF nº 13/2026 (INSS — faixas e teto de 2026)',
    'Lei nº 15.270/2025 (redutor mensal do IRRF)',
    'Receita Federal — Tributação de 2026 (tabela progressiva mensal do IRRF e redução da Lei 15.270/2025)',
    'MTE — reajuste do Seguro-Desemprego, vigência 11/01/2026',
    'Lei 8.212/1991, art. 22 (INSS patronal e RAT)',
    'LC 123/2006, Anexos III e V (Simples Nacional) e fator R',
    'Lei 15.270/2025 (retenção sobre lucros e dividendos)',
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
    // Conferido em gov.br/receitafederal (Tributação de 2026) em 2026-09-27.
    brackets: [
      { upTo: 242_880, rate: 0, deduction: 0 },
      { upTo: 282_665, rate: 0.075, deduction: 18_216 },
      { upTo: 375_105, rate: 0.15, deduction: 39_416 },
      { upTo: 466_468, rate: 0.225, deduction: 67_549 },
      { upTo: null, rate: 0.275, deduction: 90_873 },
    ],
    dependentDeduction: 18_959, // R$ 189,59
    simplifiedDiscount: 60_720, // R$ 607,20
    reducer: {
      fullExemptionUpTo: 500_000, // R$ 5.000,00 rendimento tributável
      phaseOutUpTo: 735_000, // R$ 7.350,00
      // Redução = R$ 978,62 − 0,133145 × rendimento tributável mensal
      phaseOutConstant: 97_862,
      phaseOutRate: 0.133145,
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
    // Conferido em gov.br/trabalho-e-emprego (reajuste 2026) em 2026-09-27.
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

  employerCosts: {
    socialSecurityRate: 0.2,
    ratRates: [0.01, 0.02, 0.03],
    thirdPartiesRate: 0.058, // FPAS mais comuns (comércio/indústria); varia conforme a atividade
  },

  simplesNacional: {
    // LC 123/2006, Anexos III e V (redação da LC 155/2016) — conferido no anexo publicado pela Receita.
    annexIII: [
      { upTo: 18_000_000, rate: 0.06, deduction: 0 },
      { upTo: 36_000_000, rate: 0.112, deduction: 936_000 },
      { upTo: 72_000_000, rate: 0.135, deduction: 1_764_000 },
      { upTo: 180_000_000, rate: 0.16, deduction: 3_564_000 },
      { upTo: 360_000_000, rate: 0.21, deduction: 12_564_000 },
      { upTo: 480_000_000, rate: 0.33, deduction: 64_800_000 },
    ],
    annexV: [
      { upTo: 18_000_000, rate: 0.155, deduction: 0 },
      { upTo: 36_000_000, rate: 0.18, deduction: 450_000 },
      { upTo: 72_000_000, rate: 0.195, deduction: 990_000 },
      { upTo: 180_000_000, rate: 0.205, deduction: 1_710_000 },
      { upTo: 360_000_000, rate: 0.23, deduction: 6_210_000 },
      { upTo: 480_000_000, rate: 0.305, deduction: 54_000_000 },
    ],
    factorRThreshold: 0.28,
  },

  proLabore: {
    inssRate: 0.11,
  },

  dividends: {
    // Lei 15.270/2025: acima de R$ 50 mil/mês de uma mesma empresa, retém 10% sobre o total.
    monthlyExemptUpTo: 5_000_000,
    withholdingRate: 0.1,
  },
};
