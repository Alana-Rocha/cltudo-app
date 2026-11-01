import type { Browser } from '@playwright/test';
import { expect, test } from './fixtures';

/*
 * Os TRCTs de teste são gerados aqui mesmo, imprimindo em PDF um HTML no layout do modelo oficial
 * (verbas em três colunas). Assim nenhum documento real, com dados pessoais, entra no repositório.
 * Contrato: admissão 01/03/2024, afastamento 15/06/2026, sem justa causa, salário de R$ 3.000.
 */
type Verba = [code: string, label: string, value: string];

function trctHtml({ verbas, deductions, net }: { verbas: Verba[]; deductions: Verba[]; net: string }) {
  const cells = (items: Verba[]) =>
    items.map(([code, label, value]) => `<td>${code}</td><td>${label}</td><td class="v">${value}</td>`);
  const rows = (items: Verba[]) => {
    const all = cells(items);
    const out: string[] = [];
    for (let i = 0; i < all.length; i += 3) out.push(`<tr>${all.slice(i, i + 3).join('')}</tr>`);
    return out.join('');
  };
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body { font: 10px Arial, sans-serif; } table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    td { border: 1px solid #000; padding: 3px; } .v { text-align: right; }
  </style></head><body>
    <h1>TERMO DE RESCISÃO DO CONTRATO DE TRABALHO</h1>
    <table><tr><td>01 CNPJ/CEI</td><td>00.000.000/0001-00</td><td>02 Razão Social</td><td>Empresa Exemplo Ltda</td></tr>
      <tr><td>10 PIS/PASEP</td><td>000.00000.00-0</td><td>11 Nome</td><td>Pessoa de Teste</td></tr></table>
    <table><tr><td>22 Causa do Afastamento</td><td colspan="5">SJ2 - Despedida sem justa causa, pelo empregador</td></tr>
      <tr><td>23 Remuneração Mês Anterior Afast.</td><td>3.000,00</td><td>24 Data de Admissão</td><td>01/03/2024</td>
        <td>26 Data de Afastamento</td><td>15/06/2026</td></tr></table>
    <h2>DISCRIMINAÇÃO DAS VERBAS RESCISÓRIAS</h2>
    <table>${rows(verbas)}</table>
    <table><tr><td>TOTAL RESCISÓRIO BRUTO</td><td class="v">—</td></tr></table>
    <h2>DEDUÇÕES</h2>
    <table>${rows(deductions)}</table>
    <table><tr><td>VALOR LÍQUIDO</td><td class="v">${net}</td></tr></table>
  </body></html>`;
}

const DEDUCTIONS: Verba[] = [
  ['112.1', 'Previdência Social', '112,50'],
  ['112.2', 'Prev. Social - 13º Salário', '133,19'],
  ['114.1', 'IRRF', '0,00'],
];

async function renderPdf(browser: Browser, html: string): Promise<Buffer> {
  const page = await browser.newPage();
  await page.setContent(html);
  const pdf = await page.pdf({ format: 'A4' });
  await page.close();
  return pdf;
}

async function upload(page: import('@playwright/test').Page, buffer: Buffer, name = 'trct.pdf') {
  await page.getByLabel('Anexar o TRCT em PDF').setInputFiles({ name, mimeType: 'application/pdf', buffer });
}

test.describe('Anexar o TRCT em PDF', () => {
  test('preenche o contrato e os valores recebidos, e a conferência bate', async ({ page, calculator, browser }) => {
    const pdf = await renderPdf(
      browser,
      trctHtml({
        verbas: [
          ['50', 'Saldo de 15 dias Salário', '1.500,00'],
          ['63', '13º Salário Proporcional 6/12 avos', '1.500,00'],
          ['65', 'Férias Proporc. 5/12 avos', '1.250,00'],
          ['68', 'Terço Constitucional de Férias', '416,67'],
          ['69', 'Aviso Prévio Indenizado', '3.600,00'],
          ['70', '13º Salário (Aviso Prévio Indenizado)', '250,00'],
        ],
        deductions: DEDUCTIONS,
        net: '8.270,98',
      })
    );
    await calculator.open('conferir-rescisao');
    await upload(page, pdf);

    await expect(page.getByRole('status').filter({ hasText: 'Lemos' })).toContainText('Confira cada campo');
    await expect(calculator.field('Data de admissão')).toHaveValue('01/03/2024');
    await expect(calculator.field('Data de desligamento')).toHaveValue('15/06/2026');
    await expect(calculator.field('Salário bruto')).toHaveValue('3.000,00');
    await expect(calculator.field('Saldo de salário recebido')).toHaveValue('1.500,00');
    await expect(calculator.field('13º proporcional recebido')).toHaveValue('1.750,00');
    await expect(calculator.field('Férias + 1/3 recebidas')).toHaveValue('1.666,67');
    await expect(calculator.field('Aviso prévio indenizado recebido')).toHaveValue('3.600,00');
    await expect(calculator.field('INSS descontado no TRCT')).toHaveValue('245,69');
    await expect(calculator.field('Total líquido recebido')).toHaveValue('8.270,98');

    await expect(page.getByTestId('check-headline')).toHaveText('R$ 0,00');
    await expect(calculator.result.getByText('Os valores conferem')).toBeVisible();
  });

  test('TRCT com férias a menos: a conferência aponta a diferença', async ({ page, calculator, browser }) => {
    // Pagou 3/12 de férias (750 + 250) em vez de 5/12 (1.250 + 416,67): faltam 666,67
    const pdf = await renderPdf(
      browser,
      trctHtml({
        verbas: [
          ['50', 'Saldo de 15 dias Salário', '1.500,00'],
          ['63', '13º Salário Proporcional 7/12 avos', '1.750,00'],
          ['65', 'Férias Proporc. 3/12 avos', '750,00'],
          ['68', 'Terço Constitucional de Férias', '250,00'],
          ['69', 'Aviso Prévio Indenizado', '3.600,00'],
        ],
        deductions: DEDUCTIONS,
        net: '7.604,31',
      })
    );
    await calculator.open('conferir-rescisao');
    await upload(page, pdf);

    await expect(page.getByTestId('check-headline')).toHaveText('R$ 666,67');
    await expect(page.getByRole('row', { name: /Férias \+ 1\/3/ })).toContainText('faltam R$ 666,67');
  });

  test('PDF escaneado (só imagem) pede para preencher à mão', async ({ page, calculator, browser }) => {
    const scanned = await browser.newPage();
    await scanned.setContent(`<canvas id="c" width="600" height="200"></canvas><script>
      const ctx = document.getElementById('c').getContext('2d');
      ctx.font = '20px Arial'; ctx.fillText('69 Aviso Prévio Indenizado 3.600,00', 10, 50);
    </script>`);
    const pdf = await scanned.pdf({ format: 'A4' });
    await scanned.close();

    await calculator.open('conferir-rescisao');
    await upload(page, pdf);

    await expect(page.getByRole('status').filter({ hasText: 'PDF' })).toHaveText(
      'Este PDF não tem texto: parece ser uma foto ou digitalização. Por enquanto, preencha os valores à mão.'
    );
    await expect(calculator.field('Total líquido recebido')).toHaveValue('');
  });

  test('arquivo que não é PDF é recusado sem ser lido', async ({ page, calculator }) => {
    await calculator.open('conferir-rescisao');
    await upload(page, Buffer.from('não sou um pdf'), 'trct.pdf');

    await expect(page.getByRole('status').filter({ hasText: 'PDF' })).toContainText('Esse arquivo não é um PDF');
  });

  test('o arquivo não é enviado a nenhum servidor', async ({ page, calculator, browser }) => {
    const pdf = await renderPdf(browser, trctHtml({ verbas: [['50', 'Saldo de 15 dias Salário', '1.500,00']], deductions: [], net: '1.500,00' }));
    await calculator.open('conferir-rescisao');
    const uploads: string[] = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET' || (request.postDataBuffer()?.length ?? 0) > 0) uploads.push(`${request.method()} ${request.url()}`);
    });

    await upload(page, pdf);
    await expect(page.getByRole('status').filter({ hasText: 'Lemos' })).toBeVisible();

    expect(uploads).toEqual([]);
  });
});
