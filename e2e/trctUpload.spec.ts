import path from 'node:path';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/** TRCTs sintéticos de test-fixtures/trct (gerados por scripts/generateTrctFixtures.mjs, sem dados reais). */
const fixture = (name: string) => path.resolve('test-fixtures/trct', name);

async function upload(page: Page, file: string | { name: string; mimeType: string; buffer: Buffer }) {
  await page.getByLabel('Anexar o TRCT em PDF').setInputFiles(file);
}

const readStatus = (page: Page) => page.getByRole('status').filter({ hasText: 'Lemos' });

test.describe('Anexar o TRCT em PDF', () => {
  test('modelo oficial: preenche o contrato e os valores, e a conferência bate', async ({ page, calculator }) => {
    // Sem justa causa, 01/03/2024 a 15/06/2026, R$ 3.000: o mesmo contrato dos testes de rescisão
    await calculator.open('conferir-rescisao');
    await upload(page, fixture('official-model.pdf'));

    await expect(readStatus(page)).toContainText('Confira cada campo');
    await expect(calculator.field('Data de admissão')).toHaveValue('01/03/2024');
    await expect(calculator.field('Data de desligamento')).toHaveValue('15/06/2026');
    await expect(calculator.field('Salário bruto')).toHaveValue('3.000,00');
    await expect(calculator.field('13º proporcional recebido')).toHaveValue('1.750,00');
    await expect(calculator.field('Férias + 1/3 recebidas')).toHaveValue('1.666,67');
    await expect(calculator.field('INSS descontado no TRCT')).toHaveValue('245,69');
    await expect(calculator.field('Total líquido recebido')).toHaveValue('8.270,98');

    await expect(page.getByTestId('check-headline')).toHaveText('R$ 0,00');
    await expect(calculator.result.getByText('Os valores conferem')).toBeVisible();
  });

  test('sistema de folha, acordo: lê rótulos quebrados, férias vencidas e outros descontos', async ({ page, calculator }) => {
    // Acordo, 10/02/2025 a 20/10/2026, R$ 3.000, 10 dias de férias vencidas, reembolso de VT e consignado
    await calculator.open('conferir-rescisao');
    await upload(page, fixture('payroll-agreement.pdf'));

    await expect(readStatus(page)).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Tipo de desligamento' })).toHaveText(/Acordo \(art\. 484-A\)/);
    await expect(page.getByRole('checkbox', { name: /Tenho férias vencidas/ })).toBeChecked();
    await expect(calculator.field('Dias a receber (vencidos)')).toHaveValue('10');
    await expect(calculator.field('Aviso prévio indenizado recebido')).toHaveValue('1.650,00');
    await expect(calculator.field('Outros proventos do TRCT')).toHaveValue('150,00');
    await expect(calculator.field('Outros descontos do TRCT')).toHaveValue('500,00');

    await expect(page.getByTestId('check-headline')).toHaveText('R$ 0,00');
    // O valor em reais usa espaço não separável depois do "R$".
    await expect(calculator.result.getByText(/já considera R\$\s150,00 de outros proventos e R\$\s500,00 de outros descontos/)).toBeVisible();
    await expect(calculator.result.getByText(/Acordo \(art\. 484-A\): a lei não diz/)).toBeVisible();
  });

  test('TRCT com férias a menos: a conferência aponta a diferença', async ({ page, calculator }) => {
    // Pagou 6/12 de férias proporcionais em vez de 9/12: 750 + 250 de terço = 1.000
    await calculator.open('conferir-rescisao');
    await upload(page, fixture('payroll-agreement-short-vacation.pdf'));

    await expect(page.getByTestId('check-headline')).toHaveText('R$ 1.000,00');
    await expect(page.getByRole('row', { name: /Férias \+ 1\/3/ })).toContainText('faltam R$ 1.000,00');
    await expect(page.getByRole('row', { name: /Total líquido do TRCT/ })).toContainText('faltam R$ 1.000,00');
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
    await upload(page, { name: 'trct.pdf', mimeType: 'application/pdf', buffer: pdf });

    await expect(page.getByRole('status').filter({ hasText: 'PDF' })).toHaveText(
      'Este PDF não tem texto: parece ser uma foto ou digitalização. Por enquanto, preencha os valores à mão.'
    );
    await expect(calculator.field('Total líquido recebido')).toHaveValue('');
  });

  test('arquivo que não é PDF é recusado sem ser lido', async ({ page, calculator }) => {
    await calculator.open('conferir-rescisao');
    await upload(page, { name: 'trct.pdf', mimeType: 'application/pdf', buffer: Buffer.from('não sou um pdf') });

    await expect(page.getByRole('status').filter({ hasText: 'PDF' })).toContainText('Esse arquivo não é um PDF');
  });

  test('o arquivo não é enviado a nenhum servidor', async ({ page, calculator }) => {
    await calculator.open('conferir-rescisao');
    const uploads: string[] = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET' || (request.postDataBuffer()?.length ?? 0) > 0) uploads.push(`${request.method()} ${request.url()}`);
    });

    await upload(page, fixture('official-model.pdf'));
    await expect(readStatus(page)).toBeVisible();

    expect(uploads).toEqual([]);
  });
});
