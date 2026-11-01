import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { itemsFromDocument, type PdfTextItem } from '../pdfText';
import { parseTrctItems } from '../trctParser';
import { toCents } from '../money';

/** Lê um TRCT sintético de test-fixtures/trct (gerados por scripts/generateTrctFixtures.mjs). */
async function readFixture(name: string) {
  const data = new Uint8Array(readFileSync(new URL(`../../../test-fixtures/trct/${name}`, import.meta.url)));
  const task = pdfjs.getDocument({ data, disableFontFace: true });
  try {
    return parseTrctItems(await itemsFromDocument(await task.promise));
  } finally {
    await task.destroy();
  }
}

describe('parseTrctItems — layout de sistema de folha (rótulos quebrados, valor centralizado)', () => {
  it('soma cada verba da tabela, mesmo com o rótulo em duas linhas', async () => {
    const reading = await readFixture('payroll-agreement.pdf');

    expect(reading.received).toEqual({
      balance: toCents(2000),
      thirteenth: toCents(2750), // 63 proporcional + 64 de exercício anterior (0) + 70 do aviso (0)
      vacation: toCents(4666.66), // 65 proporcionais + 66 vencidas + 68 terço + 71 do aviso
      notice: toCents(1650),
      inss: toCents(378.88), // 112.1 do saldo + 112.2 do 13º
      irrf: 0,
      net: toCents(10337.78),
      otherEarnings: toCents(150), // reembolso de VT e rubricas zeradas
      otherDeductions: toCents(500), // empréstimo consignado; o "aviso prévio" das deduções é desconto, não verba
    });
  });

  it('lê o cabeçalho com o valor embaixo do rótulo, e só da página do TRCT', async () => {
    const reading = await readFixture('payroll-agreement.pdf');

    expect(reading).toMatchObject({
      admissionDate: '10/02/2025',
      terminationDate: '20/10/2026', // a página de quitação tem outras datas, que são ignoradas
      gross: toCents(3000),
      terminationType: 'agreement',
      expiredVacation: toCents(1000),
    });
  });

  it('lista as verbas reconhecidas, sem os "outros"', async () => {
    const reading = await readFixture('payroll-agreement.pdf');

    expect(reading.found.sort()).toEqual(['balance', 'inss', 'irrf', 'net', 'notice', 'thirteenth', 'vacation']);
  });
});

describe('parseTrctItems — modelo oficial (código, rubrica e valor em linha)', () => {
  it('lê verbas, descontos, líquido e o cabeçalho ao lado do rótulo', async () => {
    const reading = await readFixture('official-model.pdf');

    expect(reading.received).toMatchObject({
      balance: toCents(1500),
      thirteenth: toCents(1750),
      vacation: toCents(1666.67),
      notice: toCents(3600),
      inss: toCents(245.69),
      irrf: 0,
      net: toCents(8270.98),
    });
    expect(reading).toMatchObject({
      admissionDate: '01/03/2024',
      terminationDate: '15/06/2026',
      gross: toCents(3000),
      terminationType: 'without_cause',
    });
  });
});

describe('parseTrctItems — casos de borda', () => {
  const item = (text: string, x: number, y: number): PdfTextItem => ({ text, x, y, width: text.length * 4, page: 1 });

  it.each([
    ['PD0 - Pedido de demissão', 'employee_resignation'],
    ['JC2 - Despedida por justa causa, pelo empregador', 'just_cause'],
    ['SJ2 - Despedida sem justa causa, pelo empregador', 'without_cause'],
    ['Rescisão por comum acordo (art. 484-A da CLT)', 'agreement'],
    ['Término do contrato de trabalho por prazo determinado', 'contract_end'],
  ])('causa "%s" vira %s', (cause, type) => {
    const reading = parseTrctItems([item('22 Causa do Afastamento', 40, 700), item(cause, 40, 685)]);
    expect(reading.terminationType).toBe(type);
  });

  it('valor de outra coluna não é atribuído a um rótulo sem valor', () => {
    const reading = parseTrctItems([
      item('VERBAS RESCISÓRIAS', 40, 600),
      item('69 Aviso Prévio Indenizado', 40, 580), // célula sem valor
      item('51 Comissões', 330, 580),
      item('150,00', 500, 580),
    ]);
    expect(reading.received.notice).toBeUndefined();
    expect(reading.received.otherEarnings).toBe(toCents(150));
  });

  it('PDF escaneado (sem texto) não preenche nada', () => {
    expect(parseTrctItems([])).toEqual({ received: {}, found: [] });
  });
});
