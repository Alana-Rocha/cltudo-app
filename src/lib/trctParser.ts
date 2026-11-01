import { toCents, type Cents } from './money';
import type { CheckedItem } from '@/engine/terminationCheck';
import type { TerminationType } from '@/engine/fgts';

/**
 * Lê os valores de um Termo de Rescisão (TRCT) a partir do texto extraído do PDF.
 *
 * A numeração dos campos muda entre modelos e sistemas de folha (o 13º proporcional é o campo 63 num,
 * 51 noutro), então a leitura é pelo nome das verbas. Cada rótulo encontrado fica com o primeiro valor
 * em reais que aparece depois dele e antes do próximo rótulo. Um rótulo colado em outro na mesma linha,
 * sem valor no meio, é qualificador do anterior: em "13º salário (aviso prévio indenizado)", o valor é do 13º.
 */

type Target = CheckedItem | 'gross' | 'ignored';

const LABELS: { target: Target; pattern: RegExp }[] = [
  { target: 'balance', pattern: /saldo de (?:\d+ dias? )?(?:de )?salarios?/g },
  { target: 'notice', pattern: /aviso previo indenizado/g },
  { target: 'thirteenth', pattern: /13\s*[oº°]?\s*salario|decimo terceiro/g },
  { target: 'vacation', pattern: /ferias|terco constitucional|1\/3 (?:de|constitucional)/g },
  { target: 'inss', pattern: /previdencia social|prev\.? social|\binss\b/g },
  { target: 'irrf', pattern: /\birrf\b|imposto de renda/g },
  { target: 'net', pattern: /(?:valor|total) liquido|liquido a receber/g },
  { target: 'gross', pattern: /remuneracao (?:mes anterior|para fins rescisorios)|maior remuneracao/g },
  // Delimitam os trechos para os valores não "vazarem" para a verba anterior.
  {
    target: 'ignored',
    pattern: /total (?:rescisorio bruto|bruto|das deducoes|de deducoes)|adiantamento|pensao alimenticia|multa (?:do )?art\.? 47[67]|vale[- ]transporte|faltas|ajuste do saldo devedor/g,
  },
];

const MONEY = /\d{1,3}(?:\.\d{3})*,\d{2}(?!\d)/;
const DATE = /\b(\d{2})\/(\d{2})\/(\d{4})\b/;
/** Trecho máximo entre dois rótulos para o segundo ser qualificador do primeiro. */
const QUALIFIER_GAP = 40;

export type TrctReading = {
  received: Partial<Record<CheckedItem, Cents>>;
  admissionDate?: string;
  terminationDate?: string;
  gross?: Cents;
  terminationType?: TerminationType;
  /** Rótulos de verbas encontrados, para mostrar à pessoa o que foi lido. */
  found: CheckedItem[];
};

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[ \t]+/g, ' ');
}

function parseMoney(text: string): Cents {
  return toCents(Number(text.replace(/\./g, '').replace(',', '.')));
}

function dateAfter(text: string, label: RegExp): string | undefined {
  const match = label.exec(text);
  if (!match) return undefined;
  const date = DATE.exec(text.slice(match.index + match[0].length, match.index + match[0].length + 60));
  return date ? `${date[1]}/${date[2]}/${date[3]}` : undefined;
}

function terminationTypeFrom(text: string): TerminationType | undefined {
  const causeMatch = /causa do afastamento|motivo do afastamento|causa da rescisao/.exec(text);
  const cause = causeMatch ? text.slice(causeMatch.index, causeMatch.index + 160) : text;
  if (/comum acordo|484-a|acordo entre as partes/.test(cause)) return 'agreement';
  if (/sem justa causa/.test(cause)) return 'without_cause';
  if (/pedido de demissao|iniciativa do empregado/.test(cause)) return 'employee_resignation';
  if (/justa causa/.test(cause)) return 'just_cause';
  if (/termino (?:do |de )?contrato|extincao (?:normal )?do contrato/.test(cause)) return 'contract_end';
  return undefined;
}

export function parseTrctText(rawText: string): TrctReading {
  const text = normalize(rawText);

  const matches = LABELS.flatMap(({ target, pattern }) =>
    [...text.matchAll(pattern)].map((match) => ({ target, start: match.index!, end: match.index! + match[0].length }))
  ).sort((a, b) => a.start - b.start);

  // Rótulo colado no anterior, na mesma linha e sem valor entre eles, é qualificador: some, e o trecho do anterior se estende.
  const labels: typeof matches = [];
  for (const match of matches) {
    const previous = labels[labels.length - 1];
    if (previous && match.start < previous.end) continue; // sobreposição: fica o que começou antes
    const gap = previous ? text.slice(previous.end, match.start) : '';
    if (previous && gap.length <= QUALIFIER_GAP && !MONEY.test(gap) && !gap.includes('\n')) {
      previous.end = match.end;
      continue;
    }
    labels.push({ ...match });
  }

  const reading: TrctReading = { received: {}, found: [] };
  labels.forEach((label, i) => {
    const next = labels[i + 1];
    const value = MONEY.exec(text.slice(label.end, next ? next.start : undefined));
    if (!value || label.target === 'ignored') return;
    const cents = parseMoney(value[0]);
    if (label.target === 'gross') {
      reading.gross ??= cents;
      return;
    }
    // Verbas que aparecem em mais de uma linha (férias + 1/3, INSS do saldo e do 13º) somam.
    reading.received[label.target] = (reading.received[label.target] ?? 0) + cents;
    if (!reading.found.includes(label.target)) reading.found.push(label.target);
  });

  reading.admissionDate = dateAfter(text, /data de admissao/);
  reading.terminationDate = dateAfter(text, /data (?:de |do )?(?:afastamento|desligamento)/);
  reading.terminationType = terminationTypeFrom(text);
  return reading;
}
