import { expect, test } from './fixtures';

// Sem escolha gravada: o banner precisa aparecer.
test.use({ cookieConsent: null });

const THIRD_PARTY_HOSTS = /googletagmanager\.com|google-analytics\.com|googlesyndication\.com|doubleclick\.net/;

test.describe('Banner de cookies (LGPD)', () => {
  test('aparece na primeira visita e leva à política de privacidade', async ({ page }) => {
    await page.goto('/');
    const banner = page.getByRole('dialog', { name: 'Aviso de cookies' });

    await expect(banner).toBeVisible();
    await banner.getByRole('link', { name: 'política de privacidade' }).click();
    await expect(page).toHaveURL('/privacidade');
  });

  test('nada de terceiros carrega antes da escolha', async ({ page, calculator }) => {
    const thirdPartyRequests: string[] = [];
    page.on('request', (request) => {
      if (THIRD_PARTY_HOSTS.test(request.url())) thirdPartyRequests.push(request.url());
    });

    await calculator.open('calculadora-salario-liquido');
    await calculator.fill('Salário bruto', '3.000,00');
    await expect(page.getByRole('dialog', { name: 'Aviso de cookies' })).toBeVisible();

    expect(thirdPartyRequests).toEqual([]);
  });

  test('"Recusar" fecha o banner e a escolha vale nas próximas visitas', async ({ page, calculator }) => {
    await page.goto('/');
    await calculator.waitForHydration();
    await page.getByRole('button', { name: 'Recusar' }).click();

    await expect(page.getByRole('dialog', { name: 'Aviso de cookies' })).toBeHidden();
    await page.reload();
    await calculator.waitForHydration();
    await expect(page.getByRole('dialog', { name: 'Aviso de cookies' })).toBeHidden();
  });

  test('"Aceitar" fecha o banner e a escolha vale nas próximas visitas', async ({ page, calculator }) => {
    await page.goto('/');
    await calculator.waitForHydration();
    await page.getByRole('button', { name: 'Aceitar' }).click();

    await expect(page.getByRole('dialog', { name: 'Aviso de cookies' })).toBeHidden();
    await page.reload();
    await calculator.waitForHydration();
    await expect(page.getByRole('dialog', { name: 'Aviso de cookies' })).toBeHidden();
  });

  test('"Preferências de cookies" no rodapé reabre o banner', async ({ page, calculator }) => {
    await page.goto('/');
    await calculator.waitForHydration();
    await page.getByRole('button', { name: 'Aceitar' }).click();

    await page.getByRole('contentinfo').getByRole('button', { name: 'Preferências de cookies' }).click();
    await expect(page.getByRole('dialog', { name: 'Aviso de cookies' })).toBeVisible();
  });
});
