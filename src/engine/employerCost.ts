import type { RuleSet } from '@/rules/schema';
import { add, clampToZero, divide, multiply, subtract, type Cents } from '@/lib/money';
import { formatDecimal, formatPercent } from '@/lib/format';
import type { CalculationResult } from './types';

/**
 * - `simples`: Simples Nacional, Anexos I, II, III e V — a contribuição patronal já está no DAS.
 * - `simples_annex_iv`: Anexo IV (ex.: construção, vigilância, limpeza) — paga INSS patronal e RAT, sem terceiros.
 * - `standard`: Lucro Presumido ou Real — INSS patronal, RAT e terceiros.
 */
export type EmployerRegime = 'simples' | 'simples_annex_iv' | 'standard';

export type EmployerCostInput = {
  grossSalary: Cents;
  regime: EmployerRegime;
  ratRate: number;
  monthlyBenefits?: Cents; // VR, VA, plano de saúde pagos pela empresa
  transportVoucherCost?: Cents; // custo mensal das passagens; a empresa paga o que passar de 6% do salário
};

export function calculateEmployerCost(input: EmployerCostInput, rules: RuleSet): CalculationResult {
  const salary = input.grossSalary;
  const thirteenthProvision = divide(salary, 12);
  const vacationProvision = multiply(divide(salary, 12), 1 + rules.vacation.bonusFraction);
  // Encargos incidem também sobre 13º e férias + 1/3, provisionados mês a mês.
  const chargeBase = add(salary, thirteenthProvision, vacationProvision);

  const paysCpp = input.regime !== 'simples';
  const fgts = multiply(chargeBase, rules.fgts.monthlyRate);
  const cpp = paysCpp ? multiply(chargeBase, rules.employerCosts.socialSecurityRate) : 0;
  const rat = paysCpp ? multiply(chargeBase, input.ratRate) : 0;
  const thirdParties = input.regime === 'standard' ? multiply(chargeBase, rules.employerCosts.thirdPartiesRate) : 0;

  const benefits = input.monthlyBenefits ?? 0;
  const transportVoucher = clampToZero(
    subtract(input.transportVoucherCost ?? 0, multiply(salary, rules.salary.transportVoucherMaxRate))
  );

  const monthlyTotal = add(chargeBase, fgts, cpp, rat, thirdParties, benefits, transportVoucher);
  const multiplier = monthlyTotal / salary;

  const pct = (rate: number) => formatPercent(rate, rate * 100 === Math.round(rate * 100) ? 0 : 1);
  const regimeNote =
    input.regime === 'simples' ? 'Simples Nacional: já incluso no DAS' : input.regime === 'simples_annex_iv' ? 'Simples, Anexo IV' : 'Lucro Presumido ou Real';

  return {
    items: [
      { key: 'salary', label: 'Salário bruto', amount: salary, type: 'earning', explanation: 'Valor informado' },
      { key: 'thirteenth', label: '13º salário (provisão mensal)', amount: thirteenthProvision, type: 'earning', explanation: '1/12 do salário' },
      { key: 'vacation', label: 'Férias + 1/3 (provisão mensal)', amount: vacationProvision, type: 'earning', explanation: '1/12 do salário + 1/3' },
      { key: 'fgts', label: `FGTS (${pct(rules.fgts.monthlyRate)})`, amount: fgts, type: 'earning', explanation: 'Sobre salário, 13º e férias', legalBasis: 'Lei 8.036/1990' },
      { key: 'cpp', label: `INSS patronal (${pct(rules.employerCosts.socialSecurityRate)})`, amount: cpp, type: 'earning', explanation: paysCpp ? 'Sobre salário, 13º e férias' : regimeNote, legalBasis: 'Lei 8.212/1991, art. 22, I' },
      { key: 'rat', label: `RAT (${pct(input.ratRate)})`, amount: rat, type: 'earning', explanation: paysCpp ? 'Seguro de acidente de trabalho, pelo grau de risco' : regimeNote, legalBasis: 'Lei 8.212/1991, art. 22, II' },
      { key: 'third-parties', label: `Terceiros (${pct(rules.employerCosts.thirdPartiesRate)})`, amount: thirdParties, type: 'earning', explanation: input.regime === 'standard' ? 'Sistema S, salário-educação e INCRA' : input.regime === 'simples' ? regimeNote : 'Não devido no Anexo IV' },
      ...(benefits > 0
        ? [{ key: 'benefits', label: 'Benefícios', amount: benefits, type: 'earning' as const, explanation: 'VR, VA, plano de saúde etc.' }]
        : []),
      ...(transportVoucher > 0
        ? [{ key: 'vt', label: 'Vale-transporte (parte da empresa)', amount: transportVoucher, type: 'earning' as const, explanation: `Custo das passagens acima de ${pct(rules.salary.transportVoucherMaxRate)} do salário` }]
        : []),
      { key: 'annual', label: 'Custo anual', amount: multiply(monthlyTotal, 12), type: 'info', explanation: `${formatDecimal(multiplier, 2)} vezes o salário bruto` },
    ],
    totals: { gross: monthlyTotal, deductions: 0, net: monthlyTotal },
    steps: [
      { label: 'Base dos encargos', formula: 'Salário + 1/12 de 13º + 1/12 de férias com 1/3', value: chargeBase },
      { label: 'Custo mensal total', formula: 'Base + FGTS + INSS patronal + RAT + terceiros + benefícios', value: monthlyTotal },
    ],
    included: [],
    excluded: [
      'Multa de 40% do FGTS em caso de demissão sem justa causa.',
      'Aviso prévio indenizado e outras verbas de rescisão.',
      'Custos indiretos: equipamentos, treinamento, exames médicos, uniforme.',
    ],
    warnings: [
      'A alíquota de terceiros e o RAT variam conforme a atividade (código FPAS e CNAE), e o RAT ainda é ajustado pelo FAP da empresa. Confirme com a contabilidade.',
    ],
    rulesVersion: rules.id,
  };
}
