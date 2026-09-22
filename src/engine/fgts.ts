import type { RuleSet } from '@/rules/schema';
import { add, multiply, type Cents } from '@/lib/money';

export type TerminationType = 'without_cause' | 'employee_resignation' | 'just_cause' | 'agreement' | 'contract_end';

export type FgtsFineInput = {
  terminationType: TerminationType;
  /** Saldo real do FGTS informado pelo usuário; se ausente, é estimado. */
  actualBalance?: Cents;
  grossSalary: Cents;
  monthsEmployed: number; // for the balance estimate, when actualBalance is absent
  thirteenthAmount: Cents; // 13º integral do ano de saída, para a base de depósito
  vacationTakenAmount: Cents; // férias gozadas + 1/3 (não o abono, que é isento de FGTS também)
  noticeIndemnifiedAmount: Cents; // 0 se o aviso não foi indenizado
  balanceAmount: Cents; // saldo de salário do mês de saída
};

export type FgtsFineResult = {
  fineRate: number; // 0, 0.20 or 0.40 depending on terminationType
  estimatedBalance: Cents;
  usedEstimate: boolean;
  depositsOnTermination: Cents; // FGTS (8%) sobre saldo, aviso indenizado e 13º da rescisão
  fine: Cents;
  warnings: string[];
};

/**
 * Estimates the FGTS balance and the termination fine (rules 3.8). This is
 * ALWAYS an approximation when `actualBalance` is not supplied: it does not
 * reproduce salary raises, overtime, or commissions deposited over the
 * contract's actual history. Prefer the real balance whenever available.
 */
export function calculateFgtsFine(input: FgtsFineInput, rules: RuleSet): FgtsFineResult {
  const fineRate =
    input.terminationType === 'without_cause'
      ? rules.fgts.fineRates.withoutCause
      : input.terminationType === 'agreement'
        ? rules.fgts.fineRates.agreement
        : 0;

  const depositsOnTermination = multiply(
    add(input.balanceAmount, input.noticeIndemnifiedAmount, input.thirteenthAmount),
    rules.fgts.monthlyRate
  );

  const warnings: string[] = [];
  let estimatedBalance: Cents;
  let usedEstimate: boolean;

  if (input.actualBalance !== undefined) {
    estimatedBalance = input.actualBalance;
    usedEstimate = false;
  } else {
    usedEstimate = true;
    // Estimate: 8% of (monthly salary × months) + 8% of 13º + 8% of vacation
    // taken (gozadas + 1/3), proportional to tenure — plus this
    // termination's own deposits. Does not reflect real raises or variable
    // pay history.
    const monthlyDeposits = multiply(multiply(input.grossSalary, input.monthsEmployed), rules.fgts.monthlyRate);
    const thirteenthDeposits = multiply(input.thirteenthAmount, rules.fgts.monthlyRate);
    const vacationDeposits = multiply(input.vacationTakenAmount, rules.fgts.monthlyRate);
    estimatedBalance = add(monthlyDeposits, thirteenthDeposits, vacationDeposits, depositsOnTermination);
    warnings.push(
      'Saldo do FGTS estimado (8% sobre salário, 13º e férias gozadas ao longo do contrato, mais os depósitos desta rescisão). Informe o saldo real do extrato do FGTS para um valor exato.'
    );
  }

  const fine = fineRate > 0 ? multiply(estimatedBalance, fineRate) : 0;

  return { fineRate, estimatedBalance, usedEstimate, depositsOnTermination, fine, warnings };
}

export type FgtsStandaloneInput = {
  grossSalary: Cents;
  isApprentice?: boolean;
  /** When provided, also estimates the rescission fine (Fase 1 §3.8). */
  rescission?: {
    terminationType: TerminationType;
    monthsEmployed: number;
    thirteenthAmount: Cents;
    vacationTakenAmount: Cents;
    noticeIndemnifiedAmount: Cents;
    balanceAmount: Cents;
    actualBalance?: Cents;
  };
};

/**
 * Standalone entry point for the FGTS calculator page (Fase 3): monthly
 * deposit, and optionally the rescission fine estimate.
 */
export function calculateFgtsStandalone(
  input: FgtsStandaloneInput,
  rules: RuleSet
): import('./types').CalculationResult {
  const rate = input.isApprentice ? rules.fgts.apprenticeRate : rules.fgts.monthlyRate;
  const monthlyDeposit = multiply(input.grossSalary, rate);

  const items: import('./types').LineItem[] = [
    {
      key: 'monthly',
      label: 'Depósito mensal do FGTS',
      amount: monthlyDeposit,
      type: 'info',
      explanation: `${(input.grossSalary / 100).toFixed(2)} × ${(rate * 100).toFixed(0)}%`,
      legalBasis: 'Lei 8.036/1990',
    },
  ];
  const warnings: string[] = [];

  if (input.rescission) {
    const fineResult = calculateFgtsFine(
      {
        terminationType: input.rescission.terminationType,
        actualBalance: input.rescission.actualBalance,
        grossSalary: input.grossSalary,
        monthsEmployed: input.rescission.monthsEmployed,
        thirteenthAmount: input.rescission.thirteenthAmount,
        vacationTakenAmount: input.rescission.vacationTakenAmount,
        noticeIndemnifiedAmount: input.rescission.noticeIndemnifiedAmount,
        balanceAmount: input.rescission.balanceAmount,
      },
      rules
    );
    warnings.push(...fineResult.warnings);
    items.push(
      {
        key: 'balance',
        label: fineResult.usedEstimate ? 'Saldo do FGTS (estimado)' : 'Saldo do FGTS (informado)',
        amount: fineResult.estimatedBalance,
        type: 'info',
        explanation: fineResult.usedEstimate ? 'Estimativa com base no salário, 13º e férias ao longo do contrato' : 'Valor informado',
      },
      {
        key: 'fine',
        label: `Multa rescisória (${(fineResult.fineRate * 100).toFixed(0)}%)`,
        amount: fineResult.fine,
        type: 'earning',
        explanation: `${(fineResult.estimatedBalance / 100).toFixed(2)} × ${(fineResult.fineRate * 100).toFixed(0)}%`,
        legalBasis: 'Lei 8.036/1990, art. 18',
      }
    );
  }

  return {
    items,
    totals: { gross: monthlyDeposit, deductions: 0, net: monthlyDeposit },
    steps: [{ label: 'Depósito mensal', formula: `${(input.grossSalary / 100).toFixed(2)} × ${(rate * 100).toFixed(0)}%`, value: monthlyDeposit }],
    included: [],
    excluded: [],
    warnings,
    rulesVersion: rules.id,
  };
}
