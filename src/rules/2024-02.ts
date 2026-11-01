import type { RuleSet } from './schema';
import { ruleSet2024_01 } from './2024-01';

/** Rule set effective 2024-02-01: só muda a tabela mensal do IRRF; o resto segue 2024-01. */
export const ruleSet2024_02: RuleSet = {
  ...ruleSet2024_01,
  id: '2024-02',
  effectiveFrom: '2024-02-01',
  sources: [
    ...ruleSet2024_01.sources.filter((source) => !source.startsWith('Lei nº 14.663')),
    'Lei nº 14.848/2024 e IN RFB nº 2.174/2024 (tabela mensal do IRRF a partir de fevereiro/2024)',
  ],
  irrf: {
    ...ruleSet2024_01.irrf,
    brackets: [
      { upTo: 225_920, rate: 0, deduction: 0 },
      { upTo: 282_665, rate: 0.075, deduction: 16_944 },
      { upTo: 375_105, rate: 0.15, deduction: 38_144 },
      { upTo: 466_468, rate: 0.225, deduction: 66_277 },
      { upTo: null, rate: 0.275, deduction: 89_600 },
    ],
    simplifiedDiscount: 56_480, // R$ 564,80
  },
};
