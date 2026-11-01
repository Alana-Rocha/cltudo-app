import type { RuleSet } from './schema';
import { ruleSet2025_01 } from './2025-01';

/** Rule set effective 2025-05-01: só muda a tabela mensal do IRRF (isenção até 2 salários mínimos). */
export const ruleSet2025_05: RuleSet = {
  ...ruleSet2025_01,
  id: '2025-05',
  effectiveFrom: '2025-05-01',
  sources: [
    ...ruleSet2025_01.sources.filter((source) => !source.startsWith('Lei nº 14.848')),
    'MP nº 1.294/2025 e Lei nº 15.191/2025, que a revogou mantendo a tabela (IRRF a partir de maio/2025)',
  ],
  irrf: {
    ...ruleSet2025_01.irrf,
    brackets: [
      { upTo: 242_880, rate: 0, deduction: 0 },
      { upTo: 282_665, rate: 0.075, deduction: 18_216 },
      { upTo: 375_105, rate: 0.15, deduction: 39_416 },
      { upTo: 466_468, rate: 0.225, deduction: 67_549 },
      { upTo: null, rate: 0.275, deduction: 90_873 },
    ],
    simplifiedDiscount: 60_720, // R$ 607,20
  },
};
