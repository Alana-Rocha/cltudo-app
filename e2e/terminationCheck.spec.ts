import { expect, test } from './fixtures';
import type { CalculatorPage } from './pages/CalculatorPage';

/*
 * Mesmo contrato dos testes de rescisão: admissão 01/03/2024, saída 15/06/2026, sem justa causa, aviso
 * indenizado (36 dias, contrato projetado até 21/07/2026), salário de R$ 3.000 e saldo do FGTS de R$ 10.000.
 * Devido no TRCT: 1.500 + 3.600 + 1.750 + 1.250 + 416,67 − 112,50 − 133,19 = 8.270,98. Multa do FGTS: 4.000.
 * O relógio dos testes está em 15/06/2026.
 */
async function fillContract(calculator: CalculatorPage, terminationDate = '15/06/2026') {
  await calculator.open('conferir-rescisao');
  await calculator.fill('Data de admissão', '01/03/2024');
  await calculator.fill('Data de desligamento', terminationDate);
  await calculator.fill('Salário bruto', '3.000,00');
  await calculator.fill('Saldo do FGTS (opcional, para um valor exato)', '10.000,00');
}

test.describe('Conferir rescisão', () => {
  test('TRCT certo: os valores conferem', async ({ page, calculator }) => {
    await fillContract(calculator);
    await calculator.fill('Total líquido recebido', '8.270,98');
    await calculator.fill('Multa do FGTS depositada', '4.000,00');

    await expect(page.getByTestId('check-headline')).toHaveText('R$ 0,00');
    await expect(calculator.result.getByText('Os valores conferem')).toBeVisible();
    await expect(page.getByRole('row', { name: /Total líquido do TRCT/ })).toContainText('confere');
    await expect(calculator.result.getByRole('heading', { name: 'O que fazer' })).toBeHidden();
  });

  test('férias pagas a menos: mostra quanto falta, a verba e o que fazer', async ({ page, calculator }) => {
    // Férias proporcionais 5/12 + 1/3 = 1.250 + 416,67 = 1.666,67; recebeu 1.000
    await fillContract(calculator);
    await calculator.fill('Saldo de salário recebido', '1.500,00');
    await calculator.fill('Férias + 1/3 recebidas', '1.000,00');

    await expect(page.getByTestId('check-headline')).toHaveText('R$ 666,67');
    await expect(calculator.result.getByText('Faltam na sua rescisão')).toBeVisible();
    await expect(page.getByRole('row', { name: /Férias \+ 1\/3/ })).toContainText('faltam R$ 666,67');
    await expect(page.getByRole('row', { name: /Saldo de salário/ })).toContainText('confere');
    await expect(page.getByRole('row', { name: /13º proporcional/ })).toContainText('não informado');
    await expect(calculator.result.getByText('Você pode reclamar na Justiça do Trabalho até 21/07/2028.')).toBeVisible();
  });

  test('desconto de INSS a mais também conta como dinheiro faltando', async ({ page, calculator }) => {
    // INSS devido: 112,50 + 133,19 = 245,69
    await fillContract(calculator);
    await calculator.fill('INSS descontado no TRCT', '345,69');

    await expect(page.getByTestId('check-headline')).toHaveText('R$ 100,00');
    await expect(page.getByRole('row', { name: /INSS descontado/ })).toContainText('faltam R$ 100,00');
  });

  test('pagamento depois de 10 dias: multa de um salário (art. 477)', async ({ page, calculator }) => {
    // Desligamento 15/05/2026 → prazo 25/05/2026; pago em 01/06/2026, 7 dias depois
    await fillContract(calculator, '15/05/2026');
    await calculator.fill('Data em que a rescisão foi paga (opcional)', '01/06/2026');

    await expect(calculator.result.getByRole('alert')).toContainText('Pagamento 7 dias depois do prazo (25/05/2026)');
    await expect(calculator.result.getByRole('alert')).toContainText('R$ 3.000,00');
    await expect(page.getByTestId('check-headline')).toHaveText('R$ 3.000,00');
  });

  test('prazos: pagamento, seguro-desemprego e Justiça do Trabalho, com o que falta para cada um', async ({ calculator }) => {
    await fillContract(calculator);
    const deadlines = calculator.result.getByRole('region', { name: 'Prazos' });

    await expect(deadlines.getByRole('listitem').filter({ hasText: 'Pagamento da rescisão' })).toContainText('até 25/06/2026 · faltam 10 dias');
    await expect(deadlines.getByRole('listitem').filter({ hasText: 'Pedido do seguro-desemprego' })).toContainText(
      '22/06/2026 a 13/10/2026 · abre em 22/06/2026'
    );
    await expect(deadlines.getByRole('listitem').filter({ hasText: 'Justiça do Trabalho' })).toContainText('até 21/07/2028');
  });

  test('pedido de demissão: sem aviso indenizado, sem multa do FGTS e sem seguro-desemprego', async ({ calculator }) => {
    await fillContract(calculator);
    await calculator.choose('Tipo de desligamento', 'Pedido de demissão');
    await calculator.choose('Aviso prévio', 'Trabalhado');

    await expect(calculator.field('Aviso prévio indenizado recebido')).toHaveCount(0);
    await expect(calculator.field('Multa do FGTS depositada')).toHaveCount(0);
    await expect(calculator.result.getByRole('region', { name: 'Prazos' })).not.toContainText('seguro-desemprego');
  });

  test.describe('acordo (art. 484-A)', () => {
    /*
     * Admissão 10/02/2025, saída 20/10/2026, R$ 3.000, aviso indenizado de 33 dias pago pela metade.
     * 13º: 2.500 projetando metade dos dias, 2.750 projetando todos. O relógio dos testes não afeta a conta.
     */
    async function fillAgreement(calculator: CalculatorPage) {
      await calculator.open('conferir-rescisao');
      await calculator.fill('Data de admissão', '10/02/2025');
      await calculator.fill('Data de desligamento', '20/10/2026');
      await calculator.fill('Salário bruto', '3.000,00');
      await calculator.choose('Tipo de desligamento', 'Acordo (art. 484-A)');
    }

    test('valor entre as duas leituras confere, com a faixa e a explicação', async ({ page, calculator }) => {
      await fillAgreement(calculator);
      await calculator.fill('13º proporcional recebido', '2.625,00');

      const row = page.getByRole('row', { name: /13º proporcional/ });
      await expect(row).toContainText('confere');
      await expect(row).toContainText(/2\.500,00\s*a R\$\s2\.750,00/);
      await expect(page.getByTestId('check-headline')).toHaveText('R$ 0,00');
      await expect(calculator.result.getByText(/Um\s+valor dentro da faixa não é tratado como erro/)).toBeVisible();
    });

    test('valor abaixo da faixa aponta quanto falta até a menor leitura', async ({ page, calculator }) => {
      await fillAgreement(calculator);
      await calculator.fill('13º proporcional recebido', '2.000,00');

      await expect(page.getByRole('row', { name: /13º proporcional/ })).toContainText('faltam R$ 500,00');
      await expect(page.getByTestId('check-headline')).toHaveText('R$ 500,00');
    });

    test('o prazo para reclamar conta metade dos dias do aviso', async ({ calculator }) => {
      await fillAgreement(calculator);
      const deadlines = calculator.result.getByRole('region', { name: 'Prazos' });
      await expect(deadlines.getByRole('listitem').filter({ hasText: 'Justiça do Trabalho' })).toContainText('até 06/11/2028');
    });
  });

  test.describe('link compartilhado', () => {
    test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

    test('leva os valores recebidos junto com o contrato', async ({ page, calculator, browser }) => {
      await fillContract(calculator);
      await calculator.fill('Férias + 1/3 recebidas', '1.000,00');
      await calculator.result.getByRole('button', { name: 'Copiar link do cálculo' }).click();
      const sharedUrl = new URL(await page.evaluate(() => navigator.clipboard.readText()));

      const otherContext = await browser.newContext({ locale: 'pt-BR' });
      const otherPage = await otherContext.newPage();
      await otherPage.goto(sharedUrl.pathname + sharedUrl.hash);

      await expect(otherPage.getByTestId('check-headline')).toHaveText('R$ 666,67');
      await otherContext.close();
    });
  });
});
