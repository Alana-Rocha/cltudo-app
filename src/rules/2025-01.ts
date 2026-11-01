import type { RuleSet } from './schema';
import { ruleSet2024_02 } from './2024-02';

/**
 * Rule set effective 2025-01-01: salário mínimo, INSS e seguro-desemprego de 2025. O IRRF segue a
 * tabela de fevereiro/2024 até abril. Values checked against the sources below on 2026-11-01.
 */
export const ruleSet2025_01: RuleSet = {
  ...ruleSet2024_02,
  id: '2025-01',
  effectiveFrom: '2025-01-01',
  sources: [
    'Decreto nº 12.342/2024 (salário mínimo de 2025)',
    'Portaria Interministerial MPS/MF nº 6/2025 (INSS — faixas e teto de 2025)',
    'Lei nº 14.848/2024 e IN RFB nº 2.174/2024 (tabela mensal do IRRF a partir de fevereiro/2024)',
    'MTE — reajuste do Seguro-Desemprego, vigência 11/01/2025',
    'Lei 8.212/1991, art. 22 (INSS patronal e RAT)',
    'LC 123/2006, Anexos III e V (Simples Nacional) e fator R',
  ],
  minimumWage: 151_800, // R$ 1.518,00

  inss: {
    brackets: [
      { upTo: 151_800, rate: 0.075, deduction: 0 },
      { upTo: 279_388, rate: 0.09, deduction: 2_277 },
      { upTo: 419_083, rate: 0.12, deduction: 10_659 },
      { upTo: null, rate: 0.14, deduction: 19_040 },
    ],
    ceiling: 815_741, // R$ 8.157,41
  },

  unemploymentInsurance: {
    ...ruleSet2024_02.unemploymentInsurance,
    tier1UpTo: 213_876, // R$ 2.138,76
    tier2UpTo: 356_496, // R$ 3.564,96
    tier2Base: 171_101, // R$ 1.711,01
    ceiling: 242_411, // R$ 2.424,11
  },
};
