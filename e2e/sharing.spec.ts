import { expect, test } from './fixtures';

/** Monta um link de compartilhamento como o app faz: JSON em base64url depois de #dados=. */
function buildSharedLink(slug: string, data: Record<string, unknown>): string {
  const encoded = Buffer.from(JSON.stringify(data)).toString('base64url');
  return `/${slug}#dados=${encoded}`;
}

test.describe('Valores preenchidos', () => {
  test('somem ao recarregar e não ficam salvos no navegador', async ({ page, calculator }) => {
    await calculator.open('calculadora-salario-liquido');
    await calculator.fill('Salário bruto', '6.000,00');
    await calculator.expectHeadline('Salário líquido', 'R$ 4.973,39');

    await page.reload();
    await calculator.waitForHydration();

    await expect(calculator.field('Salário bruto')).toHaveValue('');
    expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('6.000,00');
  });

  test('continuam lá ao navegar pelo site e voltar', async ({ page, calculator }) => {
    await calculator.open('calculadora-salario-liquido');
    await calculator.fill('Salário bruto', '6.000,00');

    await page.getByRole('navigation').getByRole('link', { name: 'Férias' }).first().click();
    await expect(page).toHaveURL(/\/calculadora-ferias$/);
    await page.goBack();
    await calculator.waitForHydration();

    await expect(calculator.field('Salário bruto')).toHaveValue('6.000,00');
  });

  test('apaga o que versões anteriores salvaram no navegador', async ({ page, calculator }) => {
    await calculator.open('calculadora-ferias');
    await page.evaluate(() => localStorage.setItem('calculadora-ferias:gross', '"2.556,00"'));

    await page.reload();
    await calculator.waitForHydration();

    await expect(calculator.field('Salário bruto')).toHaveValue('');
    expect(await page.evaluate(() => localStorage.getItem('calculadora-ferias:gross'))).toBeNull();
  });
});

test.describe('Copiar link do cálculo', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('o link reabre o mesmo cálculo em outro navegador, sem mandar os valores ao servidor', async ({
    page,
    calculator,
    browser,
  }) => {
    await calculator.open('calculadora-salario-liquido');
    await calculator.fill('Salário bruto', '6.000,00');
    await calculator.result.getByRole('button', { name: 'Copiar link do cálculo' }).click();
    await expect(calculator.result.getByRole('button', { name: 'Link copiado' })).toBeVisible();

    const sharedUrl = new URL(await page.evaluate(() => navigator.clipboard.readText()));
    expect(sharedUrl.search, 'nada na query string, que chega ao servidor').toBe('');
    expect(sharedUrl.hash).toMatch(/^#dados=/);

    // Outro contexto = outro navegador, sem os valores de quem compartilhou.
    const otherContext = await browser.newContext({ locale: 'pt-BR' });
    const otherPage = await otherContext.newPage();
    const requests: string[] = [];
    otherPage.on('request', (request) => requests.push(request.url()));
    await otherPage.goto(sharedUrl.pathname + sharedUrl.hash);

    await expect(otherPage.getByTestId('result-headline')).toHaveText('R$ 4.973,39');
    await expect(otherPage, 'o hash sai da barra de endereço depois de lido').toHaveURL(/\/calculadora-salario-liquido$/);
    expect(requests.filter((url) => url.includes('dados='))).toEqual([]);
    await otherContext.close();
  });

  test('um link adulterado é ignorado em vez de quebrar a página', async ({ page, calculator }) => {
    await page.goto(buildSharedLink('calculadora-salario-liquido', { 'calculadora-salario-liquido:gross': { evil: true } }));
    await calculator.waitForHydration();

    await expect(calculator.field('Salário bruto')).toHaveValue('');
    await calculator.fill('Salário bruto', '3.000,00');
    await expect(calculator.headline).toBeVisible();
  });

  test('um link com texto no lugar de número não injeta HTML', async ({ page, calculator }) => {
    await page.goto(
      buildSharedLink('calculadora-salario-liquido', {
        'calculadora-salario-liquido:gross': '<img src=x onerror="window.__xss=1">',
      })
    );
    await calculator.waitForHydration();

    await expect(page.locator('img[src="x"]')).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  });
});

test.describe('Imprimir', () => {
  test('o botão abre a impressão do navegador', async ({ page, calculator }) => {
    await page.addInitScript(() => {
      window.print = () => {
        (window as unknown as { __printed: boolean }).__printed = true;
      };
    });
    await calculator.open('calculadora-salario-liquido');
    await calculator.fill('Salário bruto', '3.000,00');

    await calculator.result.getByRole('button', { name: 'Imprimir' }).click();

    expect(await page.evaluate(() => (window as unknown as { __printed?: boolean }).__printed)).toBe(true);
  });
});
