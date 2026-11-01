import { registry } from '@/registry';
import { expect, test } from './fixtures';

const availableCalculators = registry.filter((calculator) => calculator.status === 'available');

const staticPages = [
  { path: '/', heading: 'Calcule seus direitos trabalhistas' },
  { path: '/sobre', heading: 'Sobre o CLTudo' },
  { path: '/contato', heading: 'Contato' },
  { path: '/privacidade', heading: 'Política de privacidade' },
];

test.describe('Todas as páginas abrem sem erro', () => {
  for (const { path, heading } of staticPages) {
    test(`${path} carrega com o título certo`, async ({ page }) => {
      const response = await page.goto(path);

      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    });
  }

  for (const { slug, title } of availableCalculators) {
    test(`calculadora "${title}" carrega com formulário, FAQ e exemplos`, async ({ page, calculator }) => {
      const response = await page.goto(`/${slug}`);
      await calculator.waitForHydration();

      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(calculator.submitButton).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Perguntas frequentes' })).toBeVisible();
    });
  }
});

test.describe('Página inexistente', () => {
  test.use({ allowedConsoleErrors: [/404/] });

  test('responde 404 com sugestões de calculadoras', async ({ page }) => {
    const response = await page.goto('/pagina-que-nao-existe');

    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible();
    await page.getByRole('link', { name: 'Ver todas as calculadoras' }).click();
    await expect(page).toHaveURL('/');
  });
});

test.describe('SEO', () => {
  test('sitemap lista todas as calculadoras e as páginas institucionais', async ({ request, baseURL }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text();

    for (const { slug } of availableCalculators) expect(sitemap).toContain(`/${slug}</loc>`);
    for (const path of ['/sobre', '/contato', '/privacidade']) expect(sitemap).toContain(`${path}</loc>`);
    expect(sitemap).not.toContain(baseURL!); // usa o domínio configurado, não o endereço local
  });

  test('robots.txt libera o site e aponta o sitemap', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text();

    expect(robots).toMatch(/Allow: \//);
    expect(robots).toMatch(/Sitemap: https?:\/\/.+\/sitemap\.xml/);
  });

  test('cada calculadora tem título e descrição próprios', async ({ page }) => {
    const titles = new Set<string>();
    for (const { slug } of availableCalculators) {
      await page.goto(`/${slug}`);
      const title = await page.title();
      expect(title).toMatch(/\| CLTudo$/);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/);
      titles.add(title);
    }
    expect(titles.size).toBe(availableCalculators.length);
  });
});
