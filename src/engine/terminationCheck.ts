import { add, subtract, type Cents } from '@/lib/money';
import { addDays } from '@/lib/dates';
import type { TerminationType } from './fgts';
import type { CalculationResult } from './types';

/** Verbas que a pessoa consegue copiar do Termo de Rescisão (TRCT) ou do extrato do FGTS. */
export type CheckedItem = 'balance' | 'notice' | 'thirteenth' | 'vacation' | 'inss' | 'irrf' | 'net' | 'fgtsFine';

export type ReceivedAmounts = Partial<Record<CheckedItem, Cents>>;

export type CheckStatus = 'ok' | 'short' | 'over' | 'not_informed';

export type CheckRow = {
  key: CheckedItem;
  label: string;
  due: Cents;
  received?: Cents;
  /** Quanto falta para a pessoa (negativo = recebeu a mais). Desconto a mais também é falta. */
  shortfall: Cents;
  status: CheckStatus;
  legalBasis: string;
};

export type TerminationCheck = {
  rows: CheckRow[];
  /** Soma do que falta, sem contar o total líquido e as verbas juntas duas vezes. */
  totalShortfall: Cents;
  informedCount: number;
};

/** Diferenças de até R$ 1,00 são arredondamento entre sistemas de folha, não erro. */
export const ROUNDING_TOLERANCE: Cents = 100;

type ItemDefinition = {
  key: CheckedItem;
  label: string;
  /** Chaves das linhas do resultado da rescisão que somam o valor devido. */
  sources: string[];
  kind: 'earning' | 'deduction';
  legalBasis: string;
  /** Só aparece quando há valor devido (ex.: não há aviso indenizado num pedido de demissão). */
  onlyWhenDue?: boolean;
};

export const CHECKED_ITEMS: ItemDefinition[] = [
  { key: 'balance', label: 'Saldo de salário', sources: ['balance'], kind: 'earning', legalBasis: 'CLT art. 459' },
  { key: 'notice', label: 'Aviso prévio indenizado', sources: ['notice'], kind: 'earning', legalBasis: 'CLT art. 487, §1º; Lei 12.506/2011', onlyWhenDue: true },
  { key: 'thirteenth', label: '13º proporcional', sources: ['thirteenth'], kind: 'earning', legalBasis: 'Lei 4.090/1962, art. 3º' },
  { key: 'vacation', label: 'Férias + 1/3', sources: ['vacation', 'vacation-bonus', 'vacation-expired'], kind: 'earning', legalBasis: 'CLT arts. 146 e 147; CF art. 7º, XVII' },
  { key: 'inss', label: 'INSS descontado', sources: ['inss-balance', 'inss-13'], kind: 'deduction', legalBasis: 'Lei 8.212/1991, art. 28' },
  { key: 'irrf', label: 'IRRF descontado', sources: ['irrf-balance', 'irrf-13'], kind: 'deduction', legalBasis: 'Lei 7.713/1988' },
  { key: 'net', label: 'Total líquido do TRCT', sources: [], kind: 'earning', legalBasis: 'CLT art. 477' },
  { key: 'fgtsFine', label: 'Multa do FGTS', sources: ['fgts-fine'], kind: 'earning', legalBasis: 'Lei 8.036/1990, art. 18, §1º e §2º', onlyWhenDue: true },
];

function sumItems(result: CalculationResult, keys: string[]): Cents {
  return result.items.filter((item) => keys.includes(item.key)).reduce((sum, item) => add(sum, item.amount), 0);
}

/** Líquido pago no TRCT: a multa do FGTS é depositada na conta do FGTS, não entra no termo. */
function trctNet(result: CalculationResult): Cents {
  return Math.max(0, subtract(result.totals.net, sumItems(result, ['fgts-fine'])));
}

export function dueAmount(result: CalculationResult, key: CheckedItem): Cents {
  if (key === 'net') return trctNet(result);
  const definition = CHECKED_ITEMS.find((item) => item.key === key)!;
  return sumItems(result, definition.sources);
}

/** Verbas que fazem sentido conferir para esta rescisão. */
export function applicableItems(result: CalculationResult | null): ItemDefinition[] {
  return CHECKED_ITEMS.filter((item) => !item.onlyWhenDue || (result !== null && dueAmount(result, item.key) > 0));
}

export function compareTermination(due: CalculationResult, received: ReceivedAmounts): TerminationCheck {
  const rows: CheckRow[] = applicableItems(due).map((item) => {
    const dueValue = dueAmount(due, item.key);
    const receivedValue = received[item.key];
    if (receivedValue === undefined) {
      return { key: item.key, label: item.label, due: dueValue, shortfall: 0, status: 'not_informed', legalBasis: item.legalBasis };
    }
    const shortfall = item.kind === 'earning' ? subtract(dueValue, receivedValue) : subtract(receivedValue, dueValue);
    const status: CheckStatus =
      Math.abs(shortfall) <= ROUNDING_TOLERANCE ? 'ok' : shortfall > 0 ? 'short' : 'over';
    return { key: item.key, label: item.label, due: dueValue, received: receivedValue, shortfall, status, legalBasis: item.legalBasis };
  });

  const informed = rows.filter((row) => row.status !== 'not_informed');
  const relevant = (row: CheckRow) => (row.status === 'ok' ? 0 : row.shortfall);
  // O total líquido já resume as verbas do TRCT: se foi informado, vale ele; senão, soma verba a verba.
  const netRow = informed.find((row) => row.key === 'net');
  const trctShortfall = netRow
    ? relevant(netRow)
    : informed.filter((row) => row.key !== 'fgtsFine').reduce((sum, row) => add(sum, relevant(row)), 0);
  const fineRow = informed.find((row) => row.key === 'fgtsFine');

  return { rows, totalShortfall: add(trctShortfall, fineRow ? relevant(fineRow) : 0), informedCount: informed.length };
}

export type Deadline = {
  key: 'payment' | 'unemployment-insurance' | 'lawsuit';
  label: string;
  /** Primeiro dia (quando o prazo é uma janela) ou o próprio prazo. */
  from?: Date;
  until: Date;
  description: string;
  legalBasis: string;
};

/** Seguro-desemprego só na dispensa sem justa causa (o acordo do art. 484-A não dá direito). */
const UNEMPLOYMENT_INSURANCE_TYPES: TerminationType[] = ['without_cause'];

function addYears(date: Date, years: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear() + years, date.getUTCMonth(), date.getUTCDate()));
}

export function paymentDeadline(terminationDate: Date): Date {
  return addDays(terminationDate, 10);
}

export function terminationDeadlines(input: {
  terminationDate: Date;
  projectedEndDate: Date;
  terminationType: TerminationType;
}): Deadline[] {
  const deadlines: Deadline[] = [
    {
      key: 'payment',
      label: 'Pagamento da rescisão',
      until: paymentDeadline(input.terminationDate),
      description: 'A empresa tem 10 dias depois do fim do contrato para pagar as verbas e entregar os documentos.',
      legalBasis: 'CLT art. 477, §6º',
    },
  ];
  if (UNEMPLOYMENT_INSURANCE_TYPES.includes(input.terminationType)) {
    deadlines.push({
      key: 'unemployment-insurance',
      label: 'Pedido do seguro-desemprego',
      from: addDays(input.terminationDate, 7),
      until: addDays(input.terminationDate, 120),
      description: 'Do 7º ao 120º dia depois da dispensa, pela Carteira de Trabalho Digital ou pelo gov.br.',
      legalBasis: 'Resolução CODEFAT 467/2005, art. 14',
    });
  }
  deadlines.push({
    key: 'lawsuit',
    label: 'Prazo para reclamar na Justiça do Trabalho',
    until: addYears(input.projectedEndDate, 2),
    description: 'Até 2 anos depois do fim do contrato (contando o aviso prévio indenizado), cobrando os últimos 5 anos.',
    legalBasis: 'CF art. 7º, XXIX; OJ 83 da SDI-1 do TST',
  });
  return deadlines;
}

export type LatePayment = { deadline: Date; daysLate: number; fine: Cents };

/** Multa de um salário quando a rescisão é paga depois do prazo (CLT art. 477, §8º). */
export function latePaymentFine(input: { terminationDate: Date; paymentDate: Date; grossSalary: Cents }): LatePayment {
  const deadline = paymentDeadline(input.terminationDate);
  const daysLate = Math.max(0, Math.round((input.paymentDate.getTime() - deadline.getTime()) / 86_400_000));
  return { deadline, daysLate, fine: daysLate > 0 ? input.grossSalary : 0 };
}
