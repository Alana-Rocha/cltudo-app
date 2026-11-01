import { test as base, expect } from '@playwright/test';
import { CalculatorPage } from './pages/CalculatorPage';

/**
 * Data fixa para todos os testes: os cálculos usam as regras vigentes "hoje",
 * então congelar o relógio mantém os valores esperados estáveis quando o ano virar.
 */
export const FIXED_NOW = new Date('2026-06-15T12:00:00-03:00');

type Options = {
  /** Escolha do banner de cookies já gravada antes de abrir a página; `null` mostra o banner. */
  cookieConsent: 'accepted' | 'rejected' | null;
  /** Erros de console que o teste espera (ex.: o 404 de uma rota inexistente). */
  allowedConsoleErrors: RegExp[];
};

type Fixtures = {
  calculator: CalculatorPage;
};

export const test = base.extend<Options & Fixtures>({
  cookieConsent: ['rejected', { option: true }],
  allowedConsoleErrors: [[], { option: true }],

  page: async ({ page, cookieConsent, allowedConsoleErrors }, use) => {
    await page.clock.setFixedTime(FIXED_NOW);

    if (cookieConsent) {
      await page.addInitScript((choice) => {
        localStorage.setItem('cookie-consent', JSON.stringify({ choice, version: 1, at: new Date().toISOString() }));
      }, cookieConsent);
    }

    // Erro de JavaScript ou de hidratação é quebra de front-end, mesmo que a tela pareça certa.
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      if (allowedConsoleErrors.some((pattern) => pattern.test(message.text()))) return;
      errors.push(`console: ${message.text()}`);
    });

    await use(page);

    expect(errors, 'a página não deve ter erros de JavaScript nem de console').toEqual([]);
  },

  calculator: async ({ page }, use) => {
    await use(new CalculatorPage(page));
  },
});

export { expect };
