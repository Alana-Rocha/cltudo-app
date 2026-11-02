import type { RuleSet } from '@/rules/schema';
import { add, clampToZero, divide, multiply, subtract, type Cents } from '@/lib/money';
import { addDays, countAvos, formatBrDate, fullYearsBetween } from '@/lib/dates';
import { calculateInss } from './inss';
import { calculateIrrf } from './irrf';
import { calculateNotice, type NoticeReason } from './notice';
import { calculateFgtsFine, type TerminationType } from './fgts';
import type { CalculationResult } from './types';
import { formatDecimal, formatPercent } from '@/lib/format';

export type NoticeMode = 'worked' | 'indemnified' | 'waived_by_employer' | 'not_fulfilled_by_employee';

export type TerminationInput = {
  admissionDate: Date;
  terminationDate: Date;
  grossSalary: Cents;
  terminationType: TerminationType;
  noticeMode: NoticeMode;
  dependents: number;
  daysWorkedInLastMonth: number; // for saldo de salário
  actualFgtsBalance?: Cents;
  averageVariables?: Cents;
  expiredVacationDays?: number; // 0..30, dias não gozados de período(s) aquisitivo(s) já vencido(s)
  expiredVacationDoubled?: boolean; // período concessivo (12 meses) já expirado — CLT art. 137 / Súmula 450 TST
  agreementProjection?: AgreementProjection; // só no acordo com aviso indenizado; o padrão é 'half'
};

/**
 * O art. 484-A manda pagar o aviso indenizado pela metade, mas não diz quantos dias ele projeta o contrato.
 * 'half' projeta metade dos dias, como costumam fazer os guias de cálculo; 'full' projeta todos, a leitura
 * mais favorável ao trabalhador.
 */
export type AgreementProjection = 'half' | 'full';

/**
 * Verba matrix from Fase 1 §3.8. `true` = due, `false` = not due, number =
 * a fixed fraction of the usual value (e.g. 0.5 aviso for "agreement").
 */
const NOTICE_DUE: Record<TerminationType, boolean | 'proportional' | 0.5> = {
  without_cause: 'proportional',
  employee_resignation: false, // pode ser descontado, nunca pago pelo empregador
  just_cause: false,
  agreement: 0.5,
  contract_end: false,
};

const THIRTEENTH_DUE: Record<TerminationType, boolean> = {
  without_cause: true,
  employee_resignation: true,
  just_cause: false,
  agreement: true,
  contract_end: true,
};

const FGTS_WITHDRAWAL_RATE: Record<TerminationType, number> = {
  without_cause: 1.0,
  employee_resignation: 0,
  just_cause: 0,
  agreement: 0.8,
  contract_end: 1.0,
};

function noticeReasonFor(type: TerminationType): NoticeReason {
  return type === 'employee_resignation' ? 'employee_resignation' : 'without_cause';
}

function isNoticeIndemnified(input: Pick<TerminationInput, 'terminationType' | 'noticeMode'>): boolean {
  return NOTICE_DUE[input.terminationType] !== false && input.noticeMode === 'indemnified';
}

/**
 * Fim do contrato para efeitos legais: com aviso prévio indenizado, a data do desligamento mais os dias de
 * aviso (CLT art. 487, §1º; OJ 82 e 83 da SDI-1 do TST). É daí que contam os avos e a prescrição.
 */
export function projectedContractEnd(
  input: Pick<TerminationInput, 'admissionDate' | 'terminationDate' | 'terminationType' | 'noticeMode' | 'agreementProjection'>,
  rules: RuleSet
): Date {
  if (!isNoticeIndemnified(input)) return input.terminationDate;
  const notice = calculateNotice(input.admissionDate, input.terminationDate, noticeReasonFor(input.terminationType), rules);
  if (NOTICE_DUE[input.terminationType] !== 0.5 || input.agreementProjection === 'full') return notice.projectedEndDate;
  // Aviso de número ímpar de dias: o dia que sobra da metade conta inteiro.
  return addDays(input.terminationDate, Math.ceil(notice.days / 2));
}

type ThirteenthAvos = {
  total: number;
  explanation: string;
  /** Saída depois de 20/12: o 13º do ano já venceu (Lei 4.749/1965, art. 1º) e não entra na conta. */
  alreadyDueAvos: number;
};

/**
 * Avos de 13º do ano da saída, contados da admissão se ela foi nesse ano, mais os do ano seguinte quando o
 * aviso indenizado projeta o contrato para lá.
 */
function countThirteenthAvos(input: TerminationInput, projectedDate: Date, rules: RuleSet): ThirteenthAvos {
  const avosIn = (year: number) => {
    const yearStart = Date.UTC(year, 0, 1);
    const yearEnd = Date.UTC(year, 11, 31);
    return countAvos(
      new Date(Math.max(yearStart, input.admissionDate.getTime())),
      new Date(Math.min(yearEnd, projectedDate.getTime())),
      rules.thirteenth.minDaysForMonth
    );
  };
  const year = input.terminationDate.getUTCFullYear();
  const pastDueDate = input.terminationDate.getTime() > Date.UTC(year, 11, 20);
  const yearAvos = avosIn(year);
  const currentAvos = pastDueDate ? 0 : yearAvos;
  const nextAvos = projectedDate.getUTCFullYear() > year ? avosIn(year + 1) : 0;
  return {
    total: currentAvos + nextAvos,
    explanation:
      currentAvos > 0 && nextAvos > 0
        ? `${currentAvos}/12 avos de ${year} + ${nextAvos}/12 avos de ${year + 1}`
        : `${currentAvos + nextAvos}/12 avos`,
    alreadyDueAvos: pastDueDate ? yearAvos : 0,
  };
}

export function calculateTermination(input: TerminationInput, rules: RuleSet): CalculationResult {
  const included: string[] = [];
  const excluded: string[] = [];
  const warnings: string[] = [];

  // Horas extras e adicionais habituais integram aviso indenizado, 13º e
  // férias (CLT art. 487 §5º, art. 142 §5º); o saldo de salário não, pois os
  // variáveis do último mês são pagos à parte.
  const averageVariables = input.averageVariables ?? 0;
  const remunerationBase = add(input.grossSalary, averageVariables);
  if (averageVariables > 0) {
    included.push(
      `Média de variáveis habituais (${formatDecimal(averageVariables / 100, 2)}) incluída no aviso indenizado, 13º, férias e FGTS.`
    );
  }

  // 1) Saldo de salário — always due.
  const balanceAmount = divide(input.grossSalary * input.daysWorkedInLastMonth, 30);
  included.push('Saldo de salário: devido em todo tipo de desligamento.');

  // 2) Aviso prévio.
  let noticeAmount: Cents = 0;
  let projectedDate = input.terminationDate;
  const notice = calculateNotice(input.admissionDate, input.terminationDate, noticeReasonFor(input.terminationType), rules);

  const noticeRule = NOTICE_DUE[input.terminationType];
  if (isNoticeIndemnified(input)) {
    const fraction = noticeRule === 0.5 ? 0.5 : 1;
    noticeAmount = multiply(remunerationBase, (notice.days / 30) * fraction);
    projectedDate = projectedContractEnd(input, rules);
    if (fraction === 0.5) {
      warnings.push(
        input.agreementProjection === 'full'
          ? 'Esta conta projeta todos os dias do aviso, a leitura mais favorável ao trabalhador no acordo (art. 484-A).'
          : 'No acordo (art. 484-A), a lei manda pagar o aviso pela metade, mas não diz se a projeção dos avos de 13º e férias também cai pela metade. Esta conta projeta metade dos dias, como costumam fazer os guias de cálculo; pela leitura mais favorável ao trabalhador, que projeta todos os dias, pode haver um avo a mais.'
      );
    }
    included.push(
      `Aviso prévio indenizado (${notice.days} dias${fraction === 0.5 ? ', 50% por acordo (art. 484-A)' : ''}): projeta o contrato até ${formatBrDate(projectedDate)} para fins de avos.`
    );
  } else if (input.terminationType === 'employee_resignation' && input.noticeMode === 'not_fulfilled_by_employee') {
    noticeAmount = -multiply(input.grossSalary, notice.days / 30);
    excluded.push('Aviso prévio: empregado não cumpriu — desconto de até 30 dias de salário.');
  } else if (input.noticeMode === 'worked') {
    included.push('Aviso prévio trabalhado: já remunerado como salário do mês, sem verba adicional.');
  } else {
    excluded.push('Aviso prévio: não devido neste tipo de desligamento.');
  }

  // 3) 13º proporcional (sobre o ano de saída, usando a data projetada).
  const thirteenthAvos = countThirteenthAvos(input, projectedDate, rules);
  const thirteenthAmount = THIRTEENTH_DUE[input.terminationType]
    ? divide(multiply(remunerationBase, thirteenthAvos.total), 12)
    : 0;
  if (THIRTEENTH_DUE[input.terminationType]) {
    included.push(`13º proporcional: ${thirteenthAvos.explanation}.`);
    const terminationYear = input.terminationDate.getUTCFullYear();
    if (thirteenthAvos.alreadyDueAvos > 0) {
      warnings.push(
        `Saída depois de 20/12: a conta considera que o 13º de ${terminationYear} já foi pago, pois o prazo legal é 20/12. Se não foi, a empresa ainda deve ${thirteenthAvos.alreadyDueAvos}/12 avos além deste resultado.`
      );
    } else if (input.terminationDate.getTime() >= Date.UTC(terminationYear, 10, 30)) {
      warnings.push(
        'O 13º aparece com o valor bruto. Se a empresa já pagou a 1ª parcela, que vence em 30/11, ela é descontada no TRCT.'
      );
    }
  } else {
    excluded.push('13º proporcional: não devido em dispensa por justa causa.');
  }

  // 4) Férias vencidas + proporcionais + 1/3 — always due (even on just cause).
  // Período aquisitivo em curso: começa no último aniversário da admissão (CLT art. 146, parágrafo único).
  // Períodos anteriores não gozados são férias vencidas, informadas à parte.
  const currentPeriodStart = new Date(
    Date.UTC(
      input.admissionDate.getUTCFullYear() + fullYearsBetween(input.admissionDate, projectedDate),
      input.admissionDate.getUTCMonth(),
      input.admissionDate.getUTCDate()
    )
  );
  const newPeriodAvos = countAvos(currentPeriodStart, projectedDate, rules.vacation.minDaysForMonth);
  // O aviso indenizado conta como tempo de serviço: se ele passa do aniversário, completa o período que estava em curso.
  const periodCompletedByNotice =
    fullYearsBetween(input.admissionDate, projectedDate) > fullYearsBetween(input.admissionDate, input.terminationDate);
  const vacationProportionalAvos = newPeriodAvos + (periodCompletedByNotice ? 12 : 0);
  const vacationExplanation = periodCompletedByNotice
    ? `12/12 avos do período completado pelo aviso + ${newPeriodAvos}/12 avos do novo`
    : `${newPeriodAvos}/12 avos`;
  const vacationBase = divide(multiply(remunerationBase, vacationProportionalAvos), 12);
  const vacationBonus = multiply(vacationBase, rules.vacation.bonusFraction);
  const vacationTotal = add(vacationBase, vacationBonus);
  included.push('Férias proporcionais + 1/3: devidas em todo tipo de desligamento, inclusive justa causa.');

  // 4b) Férias vencidas — dias não gozados de período(s) aquisitivo(s) já completos.
  const expiredVacationDays = Math.min(30, Math.max(0, input.expiredVacationDays ?? 0));
  let expiredVacationTotal: Cents = 0;
  if (expiredVacationDays > 0) {
    const expiredBase = divide(remunerationBase * expiredVacationDays, 30);
    const expiredBonus = multiply(expiredBase, rules.vacation.bonusFraction);
    expiredVacationTotal = add(expiredBase, expiredBonus);
    if (input.expiredVacationDoubled) expiredVacationTotal = multiply(expiredVacationTotal, 2);
    included.push(
      `Férias vencidas: ${expiredVacationDays} dia(s) não gozados de período(s) já vencido(s)${input.expiredVacationDoubled ? ', pagos em dobro (Súmula 450 TST)' : ''}.`
    );
    warnings.push(
      'Esta calculadora soma os dias de férias vencidas informados como um único valor; se houver mais de um período aquisitivo vencido com regras diferentes (ex.: só um deles com o prazo concessivo expirado), calcule cada um separadamente.'
    );
  }

  // 5) INSS e IRRF — apenas sobre saldo e 13º, nunca sobre aviso ou férias indenizadas.
  const inssOnBalance = calculateInss(balanceAmount, rules);
  const irrfOnBalance = calculateIrrf(
    { taxableIncome: balanceAmount, inss: inssOnBalance.total, dependents: input.dependents },
    rules
  );
  const inssOnThirteenth = calculateInss(thirteenthAmount, rules);
  const irrfOnThirteenth = calculateIrrf(
    { taxableIncome: thirteenthAmount, inss: inssOnThirteenth.total, dependents: input.dependents },
    rules
  );

  // 6) FGTS — depósitos da rescisão + multa.
  const fgts = calculateFgtsFine(
    {
      terminationType: input.terminationType,
      actualBalance: input.actualFgtsBalance,
      grossSalary: remunerationBase,
      monthsEmployed: Math.max(
        1,
        Math.round(
          (projectedDate.getTime() - input.admissionDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
        )
      ),
      thirteenthAmount,
      vacationTakenAmount: 0, // sem férias gozadas nesta rescisão, apenas proporcionais indenizadas
      noticeIndemnifiedAmount: Math.max(noticeAmount, 0),
      balanceAmount,
    },
    rules
  );
  warnings.push(...fgts.warnings);

  const withdrawalRate = FGTS_WITHDRAWAL_RATE[input.terminationType];
  if (withdrawalRate > 0) {
    included.push(`Saque do FGTS: ${formatPercent(withdrawalRate, 0)} do saldo.`);
  } else {
    excluded.push('Saque do FGTS: não autorizado neste tipo de desligamento (fica depositado).');
  }
  if (fgts.fineRate > 0) {
    included.push(`Multa do FGTS: ${formatPercent(fgts.fineRate, 0)} sobre o saldo.`);
  } else {
    excluded.push('Multa do FGTS: não devida neste tipo de desligamento.');
  }

  const grossTotal = add(balanceAmount, Math.max(noticeAmount, 0), thirteenthAmount, vacationTotal, expiredVacationTotal, fgts.fine);
  const deductions = add(inssOnBalance.total, irrfOnBalance.total, inssOnThirteenth.total, irrfOnThirteenth.total, Math.max(-noticeAmount, 0));
  const net = clampToZero(subtract(grossTotal, deductions));

  return {
    items: [
      { key: 'balance', label: 'Saldo de salário', amount: balanceAmount, type: 'earning', explanation: `${formatDecimal(input.grossSalary / 100, 2)} ÷ 30 × ${input.daysWorkedInLastMonth} dias` },
      ...(noticeAmount !== 0
        ? [{ key: 'notice', label: noticeAmount > 0 ? 'Aviso prévio indenizado' : 'Desconto de aviso prévio não cumprido', amount: noticeAmount, type: (noticeAmount > 0 ? ('earning' as const) : ('deduction' as const)), explanation: `${notice.days} dias` }]
        : []),
      { key: 'thirteenth', label: '13º proporcional', amount: thirteenthAmount, type: 'earning', explanation: thirteenthAvos.explanation },
      { key: 'vacation', label: 'Férias proporcionais', amount: vacationBase, type: 'earning', explanation: vacationExplanation },
      { key: 'vacation-bonus', label: '1/3 sobre férias proporcionais', amount: vacationBonus, type: 'earning', explanation: '1/3 constitucional' },
      ...(expiredVacationTotal > 0
        ? [{ key: 'vacation-expired', label: `Férias vencidas (${expiredVacationDays} dias)${input.expiredVacationDoubled ? ', em dobro' : ''}`, amount: expiredVacationTotal, type: 'earning' as const, explanation: `${formatDecimal(remunerationBase / 100, 2)} ÷ 30 × ${expiredVacationDays} + 1/3${input.expiredVacationDoubled ? ', × 2' : ''}`, legalBasis: 'CLT art. 137' }]
        : []),
      { key: 'inss-balance', label: 'INSS sobre saldo de salário', amount: inssOnBalance.total, type: 'deduction', explanation: 'Sobre o saldo de salário' },
      { key: 'irrf-balance', label: 'IRRF sobre saldo de salário', amount: irrfOnBalance.total, type: 'deduction', explanation: 'Sobre o saldo de salário' },
      { key: 'inss-13', label: 'INSS sobre o 13º', amount: inssOnThirteenth.total, type: 'deduction', explanation: 'Sobre o 13º proporcional, separado do saldo' },
      { key: 'irrf-13', label: 'IRRF sobre o 13º', amount: irrfOnThirteenth.total, type: 'deduction', explanation: 'Sobre o 13º proporcional, separado do saldo' },
      ...(fgts.fine > 0
        ? [{ key: 'fgts-fine', label: `Multa do FGTS (${formatPercent(fgts.fineRate, 0)})`, amount: fgts.fine, type: 'earning' as const, explanation: fgts.usedEstimate ? 'Sobre saldo estimado do FGTS' : 'Sobre saldo informado do FGTS' }]
        : []),
    ],
    totals: { gross: grossTotal, deductions, net },
    steps: [...inssOnBalance.steps, ...irrfOnBalance.steps, ...inssOnThirteenth.steps, ...irrfOnThirteenth.steps],
    included,
    excluded,
    warnings,
    rulesVersion: rules.id,
  };
}
