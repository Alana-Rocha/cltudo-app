import { toCents, type Cents } from './money';
import type { PdfTextItem } from './pdfText';
import type { CheckedItem, ReceivedKey } from '@/engine/terminationCheck';
import type { TerminationType } from '@/engine/fgts';

/**
 * Lê um Termo de Rescisão (TRCT) pelos pedaços de texto do PDF e suas posições, como uma pessoa lê a tabela:
 * cada valor pertence ao rótulo à esquerda dele na mesma célula, mesmo que o rótulo quebre em duas linhas
 * (os sistemas de folha centralizam o valor na altura da célula). No cabeçalho, o valor fica embaixo do rótulo.
 *
 * As verbas são reconhecidas pelo nome, não pela numeração dos campos, que muda entre modelos e sistemas.
 * O que não é reconhecido entra em "outros proventos" ou "outros descontos", para o total líquido bater.
 */

export type TrctReading = {
  received: Partial<Record<ReceivedKey, Cents>>;
  admissionDate?: string;
  terminationDate?: string;
  gross?: Cents;
  terminationType?: TerminationType;
  /** Valor das férias vencidas (sem o 1/3), para sugerir quantos dias eram. */
  expiredVacation?: Cents;
  /** Verbas reconhecidas, para mostrar à pessoa o que foi lido. */
  found: CheckedItem[];
};

type Target = CheckedItem | 'expiredVacation' | 'otherEarnings' | 'otherDeductions' | 'ignored';

/** Valem em qualquer parte da tabela. */
const ANYWHERE: [Target, RegExp][] = [
  ['ignored', /total\s+(?:rescisorio\s+)?bruto|total\s+(?:das\s+|de\s+)?deducoes|ajuste\s+do\s+saldo\s+devedor/],
  ['net', /(?:valor|total)\s+liquido|liquido\s+a\s+receber/],
  ['inss', /previdencia\s+social|prev\.?\s*social|\binss\b/],
  ['irrf', /\birrf\b|imposto\s+de\s+renda/],
];

/** Só na parte das verbas (acima de "Deduções"); a ordem resolve rótulos compostos. */
const EARNINGS: [Target, RegExp][] = [
  ['otherEarnings', /13\s*[oº°]?\s*salario\s*-?\s*exerc/], // 13º de anos anteriores: a conta não cobre
  ['thirteenth', /13\s*[oº°]?\s*salario|decimo\s+terceiro/],
  ['expiredVacation', /ferias\s+venc/],
  ['vacation', /ferias|terco\s+constituc|1\/3/],
  ['notice', /aviso\s+previo\s+indenizado/],
  ['balance', /saldo\s+(?:de\s+)?(?:\d+\s+dias|salario)/],
];

const SUMMARY_LABEL = /(?:valor|total)\s+liquido|liquido\s+a\s+receber|^total\b/;
const MONEY = /^(?:r\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2})$/;
const DATE = /(\d{2})\/(\d{2})\/(\d{4})/;
/** Metade da altura de uma linha da tabela: até aqui, o rótulo é da mesma célula do valor. */
const ROW_HALF_HEIGHT = 9;
/** Distância máxima do início do rótulo ao valor da mesma célula (uma coluna de rótulo + valor). */
const MAX_LABEL_TO_VALUE = 250;

type Item = PdfTextItem & { norm: string };

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function parseMoney(text: string): Cents {
  return toCents(Number(text.replace(/\./g, '').replace(',', '.')));
}

/** Valor de um campo do cabeçalho: no mesmo pedaço, logo à direita ou logo abaixo do rótulo. */
function headerValue(items: Item[], label: RegExp, value: RegExp): string | undefined {
  const labelItem = items.find((item) => label.test(item.norm));
  if (!labelItem) return undefined;
  const match = label.exec(labelItem.norm)!;
  const inline = value.exec(labelItem.norm.slice(match.index + match[0].length));
  if (inline) return inline[0];

  const near = items
    .filter((item) => item !== labelItem && value.test(item.norm))
    .map((item) => ({ item, dy: labelItem.y - item.y, dx: item.x - labelItem.x }))
    .filter(
      ({ dy, dx }) =>
        (Math.abs(dy) <= 3 && dx > 0 && dx <= MAX_LABEL_TO_VALUE) || // à direita, na mesma linha
        (dy > 3 && dy <= 24 && dx >= -10 && dx <= labelItem.width) // embaixo, na mesma coluna
    )
    .sort((a, b) => Math.abs(a.dy) - Math.abs(b.dy) || a.dx - b.dx)[0];
  return near ? value.exec(near.item.norm)![0] : undefined;
}

function terminationTypeFrom(cause: string): TerminationType | undefined {
  if (/acordo|484-?a/.test(cause)) return 'agreement';
  if (/sem\s+justa\s+causa/.test(cause)) return 'without_cause';
  if (/pedido\s+de\s+demissao|iniciativa\s+do\s+empregado/.test(cause)) return 'employee_resignation';
  if (/justa\s+causa/.test(cause)) return 'just_cause';
  if (/termino|extincao/.test(cause)) return 'contract_end';
  return undefined;
}

function classify(label: string, inDeductions: boolean): Target {
  for (const [target, pattern] of ANYWHERE) if (pattern.test(label)) return target;
  if (inDeductions) return 'otherDeductions';
  for (const [target, pattern] of EARNINGS) if (pattern.test(label)) return target;
  return 'otherEarnings';
}

export function parseTrctItems(pdfItems: PdfTextItem[]): TrctReading {
  const all: Item[] = pdfItems.map((item) => ({ ...item, norm: normalize(item.text) }));
  // O TRCT é a página com a tabela de verbas; as seguintes (quitação, assinaturas) repetem dados.
  const tableHeading = all.find((item) => /verbas rescisorias/.test(item.norm));
  const items = tableHeading ? all.filter((item) => item.page === tableHeading.page) : all;

  const reading: TrctReading = { received: {}, found: [] };

  const header = tableHeading ? items.filter((item) => item.y > tableHeading.y) : items;
  const admission = headerValue(header, /data\s+de\s+admissao/, DATE);
  const termination = headerValue(header, /data\s+(?:de\s+|do\s+)?(?:afastamento|desligamento)/, DATE);
  const gross = headerValue(header, /remuneracao\s+(?:mes\s+ant|para\s+fins)|maior\s+remuneracao/, /\d{1,3}(?:\.\d{3})*,\d{2}/);
  const cause = headerValue(header, /causa\s+(?:do\s+afastamento|da\s+rescisao)|motivo\s+do\s+afastamento/, /[a-z].{5,}/);
  if (admission) reading.admissionDate = admission;
  if (termination) reading.terminationDate = termination;
  if (gross) reading.gross = parseMoney(gross);
  if (cause) reading.terminationType = terminationTypeFrom(cause);

  const deductionsHeading = items.find((item) => /^deducoes$|^descontos$/.test(item.norm));
  const table = tableHeading ? items.filter((item) => item.y < tableHeading.y) : items;
  const values = table.filter((item) => MONEY.test(item.norm));
  const labels = table.filter((item) => !MONEY.test(item.norm));

  // Cada pedaço de rótulo vai para o primeiro valor à direita dele na mesma faixa de altura. Linhas de total
  // (valor líquido, total bruto) podem ocupar a largura toda, com o valor na outra ponta.
  const labelOf = new Map<Item, Item[]>();
  for (const label of labels) {
    const maxDistance = SUMMARY_LABEL.test(label.norm) ? Infinity : MAX_LABEL_TO_VALUE;
    const value = values
      .filter((v) => v.x > label.x && v.x - label.x <= maxDistance && Math.abs(v.y - label.y) <= ROW_HALF_HEIGHT)
      .sort((a, b) => a.x - b.x || Math.abs(a.y - label.y) - Math.abs(b.y - label.y))[0];
    if (value) labelOf.set(value, [...(labelOf.get(value) ?? []), label]);
  }

  for (const value of values) {
    const parts = labelOf.get(value);
    if (!parts) continue;
    const label = parts
      .sort((a, b) => b.y - a.y || a.x - b.x)
      .map((part) => part.norm)
      .join(' ');
    const target = classify(label, deductionsHeading ? value.y < deductionsHeading.y : false);
    if (target === 'ignored') continue;
    const cents = parseMoney(MONEY.exec(value.norm)![1]!);

    if (target === 'expiredVacation') reading.expiredVacation = (reading.expiredVacation ?? 0) + cents;
    // Férias vencidas entram junto com as demais férias na conferência.
    const key: ReceivedKey = target === 'expiredVacation' ? 'vacation' : target;
    reading.received[key] = (reading.received[key] ?? 0) + cents;
    if (key !== 'otherEarnings' && key !== 'otherDeductions' && !reading.found.includes(key)) reading.found.push(key);
  }

  return reading;
}
