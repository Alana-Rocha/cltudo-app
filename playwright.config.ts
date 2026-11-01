import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
const isCi = Boolean(process.env.CI);

/**
 * Testes E2E contra o build de produção (`next build` + `next start`), que é o que vai ao ar.
 * Porta própria para não colidir com o `npm run dev` na 3000.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 2 : undefined,
  reporter: isCi ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // No celular roda só o que depende de layout; o resto não muda com a tela.
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: ['smoke.spec.ts', 'responsive.spec.ts'] },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCi,
    timeout: 240_000,
  },
});
