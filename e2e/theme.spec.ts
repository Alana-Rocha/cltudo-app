import { expect, test } from './fixtures';

test.describe('Tema claro e escuro', () => {
  test('o botão alterna o tema e a escolha continua depois de recarregar', async ({ page, calculator }) => {
    await page.goto('/');
    await calculator.waitForHydration();
    const html = page.locator('html');

    await page.getByRole('button', { name: 'Ativar modo escuro' }).click();
    await expect(html).toHaveClass(/\bdark\b/);

    await page.reload();
    await expect(html).toHaveClass(/\bdark\b/);

    await page.getByRole('button', { name: 'Ativar modo claro' }).click();
    await expect(html).not.toHaveClass(/\bdark\b/);
  });

  test.describe('sem escolha salva', () => {
    test.use({ colorScheme: 'dark' });

    test('segue a preferência do sistema', async ({ page, calculator }) => {
      await page.goto('/');
      await calculator.waitForHydration();

      await expect(page.locator('html')).toHaveClass(/\bdark\b/);
      await expect(page.getByRole('button', { name: 'Ativar modo claro' })).toBeVisible();
    });
  });
});
