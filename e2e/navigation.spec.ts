import { registry } from '@/registry';
import { expect, test } from './fixtures';

test.describe('Página inicial', () => {
  test('lista todas as calculadoras disponíveis', async ({ page }) => {
    await page.goto('/');

    for (const { slug } of registry.filter((calculator) => calculator.status === 'available')) {
      await expect(page.getByRole('main').locator(`a[href="/${slug}"]`).first()).toBeVisible();
    }
  });

  test('a busca filtra por nome, ignora acentos e pode ser limpa', async ({ page, calculator }) => {
    await page.goto('/');
    await calculator.waitForHydration();
    const search = page.getByRole('searchbox');
    const vacationLink = page.getByRole('main').locator('a[href="/calculadora-ferias"]');
    const overtimeLink = page.getByRole('main').locator('a[href="/calculadora-hora-extra"]');

    await search.fill('ferias');
    await expect(vacationLink.first()).toBeVisible();
    await expect(overtimeLink).toHaveCount(0);

    await search.fill('xyz inexistente');
    await expect(page.getByText('Nenhuma calculadora encontrada para “xyz inexistente”.')).toBeVisible();

    await page.getByRole('button', { name: 'Limpar busca' }).click();
    await expect(search).toHaveValue('');
    await expect(overtimeLink.first()).toBeVisible();
  });

  test('clicar numa calculadora abre a página dela', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('main').locator('a[href="/calculadora-rescisao"]').first().click();

    await expect(page).toHaveURL('/calculadora-rescisao');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Rescisão');
  });
});

test.describe('Navegação entre páginas', () => {
  test('menu do topo marca a página atual', async ({ page, isMobile }) => {
    test.skip(isMobile, 'o menu do topo fica escondido no celular');
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Principais calculadoras' });

    await nav.getByRole('link', { name: 'Férias' }).click();

    await expect(page).toHaveURL('/calculadora-ferias');
    await expect(nav.getByRole('link', { name: 'Férias' })).toHaveAttribute('aria-current', 'page');
  });

  test('breadcrumb leva de volta ao início', async ({ page }) => {
    await page.goto('/calculadora-irrf');
    const breadcrumb = page.getByRole('navigation', { name: 'Você está em' });

    await expect(breadcrumb.getByRole('link', { name: 'Salário e descontos' })).toBeVisible();
    await breadcrumb.getByRole('link', { name: 'Início' }).click();
    await expect(page).toHaveURL('/');
  });

  test('calculadoras relacionadas levam a outras calculadoras', async ({ page }) => {
    await page.goto('/calculadora-salario-liquido');
    const related = page.getByRole('navigation', { name: 'Calculadoras relacionadas' });

    await related.locator('a[href="/calculadora-inss"]').click();
    await expect(page).toHaveURL('/calculadora-inss');
  });

  for (const { link, heading } of [
    { link: 'Sobre', heading: 'Sobre o CLTudo' },
    { link: 'Contato', heading: 'Contato' },
    { link: 'Política de privacidade', heading: 'Política de privacidade' },
  ]) {
    test(`rodapé: "${link}" abre a página`, async ({ page }) => {
      await page.goto('/');
      await page.getByRole('contentinfo').getByRole('link', { name: link, exact: true }).click();

      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    });
  }
});

test.describe('Resultado', () => {
  test('"Como chegamos a esse valor?" abre e fecha o passo a passo', async ({ calculator }) => {
    await calculator.open('calculadora-inss');
    await calculator.fill('Salário de contribuição', '4.000,00');
    const toggle = calculator.result.getByRole('button', { name: 'Como chegamos a esse valor?' });
    const steps = calculator.result.getByRole('table');

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(steps).toBeHidden();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(steps).toContainText('INSS — total');

    await toggle.click();
    await expect(steps).toBeHidden();
  });

  test('mostra a versão das regras usada no cálculo', async ({ calculator }) => {
    await calculator.open('calculadora-salario-liquido');
    await calculator.fill('Salário bruto', '3.000,00');

    await expect(calculator.result.getByText('Cálculo com regras vigentes a partir de janeiro de 2026.')).toBeVisible();
  });
});
