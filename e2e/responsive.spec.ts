import { registry } from '@/registry';
import { expect, test } from './fixtures';

const paths = ['/', ...registry.filter((calculator) => calculator.status === 'available').map(({ slug }) => `/${slug}`)];

test.describe('Layout sem rolagem horizontal', () => {
  for (const path of paths) {
    test(`${path} cabe na largura da tela`, async ({ page, calculator }) => {
      await page.goto(path);
      await calculator.waitForHydration();

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, 'pixels além da largura da tela').toBeLessThanOrEqual(0);
    });
  }

  test('o resultado da rescisão também cabe na tela', async ({ page, calculator }) => {
    await calculator.open('calculadora-rescisao');
    await calculator.fill('Data de admissão', '01/03/2024');
    await calculator.fill('Data de desligamento', '15/06/2026');
    await calculator.fill('Salário bruto', '3.000,00');
    await expect(calculator.headline).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
