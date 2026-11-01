/**
 * Gera os TRCTs sintéticos usados nos testes (test-fixtures/trct/*.pdf), imprimindo HTML em PDF no Chromium.
 * Dados pessoais são fictícios; os valores batem com o motor de cálculo para cada cenário.
 *
 *   node scripts/generateTrctFixtures.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const OUT_DIR = new URL('../test-fixtures/trct/', import.meta.url);

const BASE_STYLE = `
  body { font: 9px Arial, sans-serif; margin: 0; }
  table { width: 100%; border-collapse: collapse; }
  td { border: 1px solid #000; padding: 2px 3px; vertical-align: top; }
  h1 { font-size: 14px; text-align: center; margin: 4px 0; }
  .section { background: #ccc; font-weight: bold; text-align: center; }
  .label { font-size: 7px; display: block; }
  .value { font-size: 10px; display: block; }
  .v { text-align: right; vertical-align: middle; width: 13%; white-space: nowrap; }
  .r { width: 20%; }
`;

/** Layout de sistema de folha, como um TRCT real: rótulos que quebram linha e valor centralizado na célula. */
function payrollSystemTrct({ cause, admission, termination, gross, verbas, deductions }) {
  const header = (label, value) => `<td><span class="label">${label}</span><span class="value">${value}</span></td>`;
  const rows = (cells) => {
    const out = [];
    for (let i = 0; i < cells.length; i += 3) {
      const row = cells.slice(i, i + 3);
      while (row.length < 3) row.push(['', '']);
      out.push(`<tr>${row.map(([label, value]) => `<td class="r">${label}</td><td class="v">${value}</td>`).join('')}</tr>`);
    }
    return out.join('');
  };
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_STYLE}</style></head><body>
    <h1>TERMO DE RESCISÃO DO CONTRATO DE TRABALHO</h1>
    <table><tr><td colspan="4" class="section">IDENTIFICAÇÃO DO EMPREGADOR</td></tr>
      <tr>${header('01 CNPJ/CEI', '00.000.000/0001-00')}${header('02 Razão Social/Nome', 'EMPRESA FICTÍCIA LTDA')}</tr>
      <tr><td colspan="4" class="section">IDENTIFICAÇÃO DO TRABALHADOR</td></tr>
      <tr>${header('10 PIS/PASEP', '000.00000.00-0')}${header('11 Nome', 'PESSOA DE TESTE')}</tr>
      <tr>${header('18 CPF', '000.000.000-00')}${header('19 Data de Nascimento', '01/01/1990')}</tr>
      <tr><td colspan="4" class="section">DADOS DO CONTRATO</td></tr>
      <tr><td colspan="4"><span class="label">22 Causa do Afastamento</span><br><span class="value">${cause}</span></td></tr>
    </table>
    <table><tr>${header('23 Remuneração Mês Ant.', `R$ ${gross}`)}${header('24 Data de Admissão', admission)}${header('25 Data do Aviso Prévio', termination)}${header('26 Data de Afastamento', termination)}${header('27 Cód. Afastamento', 'XX')}</tr></table>
    <table><tr><td colspan="6" class="section">DISCRIMINAÇÃO DAS VERBAS RESCISÓRIAS</td></tr>
      <tr><td colspan="6"><b>VERBAS RESCISÓRIAS</b></td></tr>
      <tr><td>Rubrica</td><td>Valor</td><td>Rubrica</td><td>Valor</td><td>Rubrica</td><td>Valor</td></tr>
      ${rows(verbas)}
      <tr><td colspan="6"><b>DEDUÇÕES</b></td></tr>
      <tr><td>Desconto</td><td>Valor</td><td>Desconto</td><td>Valor</td><td>Desconto</td><td>Valor</td></tr>
      ${rows(deductions)}
    </table>
    <div style="page-break-before: always"></div>
    <h1>TERMO DE QUITAÇÃO DE RESCISÃO DE CONTRATO DE TRABALHO</h1>
    <table><tr>${header('24 Data de Admissão', '31/12/1999')}${header('26 Data de Afastamento', '31/12/1999')}</tr></table>
    <p>Foi realizado o efetivo pagamento das verbas rescisórias, no valor líquido de R$ 99.999,99.</p>
  </body></html>`;
}

/** Layout do modelo oficial simplificado: código, rubrica e valor em colunas, uma linha por rubrica. */
function officialModelTrct() {
  const cells = (items) => items.map(([code, label, value]) => `<td>${code}</td><td>${label}</td><td style="text-align:right">${value}</td>`);
  const rows = (items) => {
    const all = cells(items);
    const out = [];
    for (let i = 0; i < all.length; i += 3) out.push(`<tr>${all.slice(i, i + 3).join('')}</tr>`);
    return out.join('');
  };
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_STYLE} td { vertical-align: middle; }</style></head><body>
    <h1>TERMO DE RESCISÃO DO CONTRATO DE TRABALHO</h1>
    <table><tr><td>22 Causa do Afastamento</td><td colspan="5">SJ2 - Despedida sem justa causa, pelo empregador</td></tr>
      <tr><td>23 Remuneração Mês Anterior Afast.</td><td>3.000,00</td><td>24 Data de Admissão</td><td>01/03/2024</td>
        <td>26 Data de Afastamento</td><td>15/06/2026</td></tr></table>
    <h2>DISCRIMINAÇÃO DAS VERBAS RESCISÓRIAS</h2>
    <table>${rows([
      ['50', 'Saldo de 15 dias Salário', '1.500,00'],
      ['63', '13º Salário Proporcional 6/12 avos', '1.500,00'],
      ['65', 'Férias Proporc. 5/12 avos', '1.250,00'],
      ['68', 'Terço Constitucional de Férias', '416,67'],
      ['69', 'Aviso Prévio Indenizado', '3.600,00'],
      ['70', '13º Salário (Aviso Prévio Indenizado)', '250,00'],
    ])}</table>
    <table><tr><td>TOTAL RESCISÓRIO BRUTO</td><td style="text-align:right">8.516,67</td></tr></table>
    <h2>DEDUÇÕES</h2>
    <table>${rows([
      ['112.1', 'Previdência Social', '112,50'],
      ['112.2', 'Prev. Social - 13º Salário', '133,19'],
      ['114.1', 'IRRF', '0,00'],
    ])}</table>
    <table><tr><td>VALOR LÍQUIDO</td><td style="text-align:right">8.270,98</td></tr></table>
  </body></html>`;
}

// Acordo (art. 484-A): admissão 10/02/2025, afastamento 20/10/2026, R$ 3.000, aviso indenizado de 33 dias pela
// metade, 10 dias de férias vencidas, R$ 150 de reembolso de VT e R$ 500 de empréstimo consignado.
const agreementVerbas = (vacationProportional, vacationThird) => [
  ['50 Saldo de 20 dias<br>(líquido de 0 /faltas e DSR)', '2.000,00'],
  ['51 Comissões', '0,00'],
  ['52 Gratificação', '0,00'],
  ['53 Adic. de Insalubridade<br>%', '0,00'],
  ['54 Adic. de Periculosidade<br>%', '0,00'],
  ['55 Adic. Noturno<br>Horas a %', '0,00'],
  ['58 Descanso Semanal<br>Remunerado (DSR)', '0,00'],
  ['59 Reflexo do DSR sobre<br>Salário Variável', '0,00'],
  ['60 Multa Art. 477, § 8º/CLT', '0,00'],
  ['62 Salário-Família', '0,00'],
  ['63 13º Salário Proporcional<br>11/12 avos', '2.750,00'],
  ['64 13º Salário-Exerc.<br>- /12 avos', '0,00'],
  ['65 Férias Proporc<br>10/12 avos', vacationProportional],
  ['66 Férias Venc. Per. Aquis.<br>10/02/2025 a 09/02/2026', '1.000,00'],
  ['68 Terço Constituc. de Férias', vacationThird],
  ['69 Aviso Prévio Indenizado', '1.650,00'],
  ['70 13º Salário (Aviso Prévio<br>Indenizado)', '0,00'],
  ['71 Férias (Aviso Prévio<br>Indenizado)', '0,00'],
  ['95.7 Reembolso VT', '150,00'],
  ['99 Ajuste do Saldo Devedor', '0,00'],
  ['<b>TOTAL BRUTO</b>', '—'],
];
const agreementDeductions = (net) => [
  ['100 Pensão Alimentícia', '0,00'],
  ['101 Adiantamento Salarial', '0,00'],
  ['102 Adiantamento 13º Salário', '0,00'],
  ['103 Aviso Prévio Indenizado', '0,00'],
  ['112.1 Previdência Social', '155,69'],
  ['112.2 Prev. Social - 13º Salário', '223,19'],
  ['114.1 IRRF', '0,00'],
  ['114.2 IRRF sobre 13º Salário', '0,00'],
  ['115.7 Crédito do trabalhador', '500,00'],
  ['<b>TOTAL DEDUÇÕES</b>', '878,88'],
  ['<b>VALOR LÍQUIDO</b>', net],
];
const agreement = {
  cause: 'Rescisão de contrato por acordo com aviso prévio indenizado',
  admission: '10/02/2025',
  termination: '20/10/2026',
  gross: '3.000,00',
};

const FIXTURES = {
  'official-model.pdf': officialModelTrct(),
  // Bate com o motor: verbas 2.000 + 2.750 + 4.666,66 + 1.650 + 150 − 378,88 de INSS − 500 = 10.337,78
  'payroll-agreement.pdf': payrollSystemTrct({
    ...agreement,
    verbas: agreementVerbas('2.500,00', '1.166,66'),
    deductions: agreementDeductions('10.337,78'),
  }),
  // Mesmo acordo pagando 7/12 de férias proporcionais em vez de 10/12: faltam 750 + 250 = 1.000
  'payroll-agreement-short-vacation.pdf': payrollSystemTrct({
    ...agreement,
    verbas: agreementVerbas('1.750,00', '916,66'),
    deductions: agreementDeductions('9.337,78'),
  }),
};

mkdirSync(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, html] of Object.entries(FIXTURES)) {
  await page.setContent(html);
  writeFileSync(new URL(name, OUT_DIR), await page.pdf({ format: 'A4', margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' } }));
  console.log(`test-fixtures/trct/${name}`);
}
await browser.close();
