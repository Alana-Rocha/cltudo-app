import type { RuleSet } from './schema';

/**
 * Rule set effective 2024-01-01 (salário mínimo, INSS e seguro-desemprego de 2024; IRRF ainda com a
 * tabela de maio/2023). Values checked against the sources below on 2026-11-01.
 * Antes de 2026 não havia o redutor do IRRF nem a retenção sobre dividendos: ficam zerados.
 */
export const ruleSet2024_01: RuleSet = {
  id: '2024-01',
  effectiveFrom: '2024-01-01',
  sources: [
    'Decreto nº 11.864/2023 (salário mínimo de 2024)',
    'Portaria Interministerial MPS/MF nº 2/2024 (INSS — faixas e teto de 2024)',
    'Lei nº 14.663/2023 (tabela mensal do IRRF de maio/2023 a janeiro/2024)',
    'MTE — tabela anual do Seguro-Desemprego, vigência 11/01/2024',
    'Lei 8.212/1991, art. 22 (INSS patronal e RAT)',
    'LC 123/2006, Anexos III e V (Simples Nacional) e fator R',
  ],
  minimumWage: 141_200, // R$ 1.412,00

  inss: {
    brackets: [
      { upTo: 141_200, rate: 0.075, deduction: 0 },
      { upTo: 266_668, rate: 0.09, deduction: 2_118 },
      { upTo: 400_003, rate: 0.12, deduction: 10_118 },
      { upTo: null, rate: 0.14, deduction: 18_118 },
    ],
    ceiling: 778_602, // R$ 7.786,02
  },

  irrf: {
    brackets: [
      { upTo: 211_200, rate: 0, deduction: 0 },
      { upTo: 282_665, rate: 0.075, deduction: 15_840 },
      { upTo: 375_105, rate: 0.15, deduction: 37_040 },
      { upTo: 466_468, rate: 0.225, deduction: 65_173 },
      { upTo: null, rate: 0.275, deduction: 88_496 },
    ],
    dependentDeduction: 18_959, // R$ 189,59
    simplifiedDiscount: 52_800, // R$ 528,00 (25% do limite da faixa isenta)
    reducer: { fullExemptionUpTo: 0, phaseOutUpTo: 0, phaseOutConstant: 0, phaseOutRate: 0 },
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
    maxSoldFraction: 1 / 3,
    split: { maxPeriods: 3, minLongestDays: 14, minOtherDays: 5 },
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
    additionalRate: 0.2,
    reducedHourMinutes: 52.5,
  },

  unhealthiness: {
    rates: { low: 0.1, medium: 0.2, high: 0.4 },
  },

  hazardPay: {
    rate: 0.3,
  },

  unemploymentInsurance: {
    tier1UpTo: 204_139, // R$ 2.041,39
    tier1Rate: 0.8,
    tier2UpTo: 340_265, // R$ 3.402,65
    tier2Base: 163_310, // R$ 1.633,10
    tier2Rate: 0.5,
    ceiling: 231_374, // R$ 2.313,74
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
    thirdPartiesRate: 0.058,
  },

  simplesNacional: {
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
    monthlyExemptUpTo: 0,
    withholdingRate: 0, // retenção só passou a existir em 2026 (Lei 15.270/2025)
  },
};
