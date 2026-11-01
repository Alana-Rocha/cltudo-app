import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Interações comuns a todas as calculadoras, pelos rótulos que a pessoa vê na tela.
 * Valores monetários são digitados como aparecem no campo (ex.: "6.000,00").
 */
export class CalculatorPage {
  constructor(readonly page: Page) {}

  /** Abre a calculadora e espera a hidratação: antes disso, o que se digita não chega ao React. */
  async open(slug: string) {
    await this.page.goto(`/${slug}`);
    await this.waitForHydration();
  }

  async waitForHydration() {
    // O botão de tema só é renderizado depois de montado no navegador.
    await expect(this.page.getByRole('button', { name: /Ativar modo (claro|escuro)/ })).toBeVisible();
  }

  /** Campo de texto, moeda, data ou número pelo nome acessível (o "*" de obrigatório não faz parte dele). */
  field(label: string): Locator {
    return this.page
      .getByRole('textbox', { name: label, exact: true })
      .or(this.page.getByRole('spinbutton', { name: label, exact: true }));
  }

  async fill(label: string, value: string) {
    await this.field(label).fill(value);
  }

  async choose(label: string, option: string) {
    await this.page.getByRole('combobox', { name: label, exact: true }).click();
    await this.page.getByRole('option', { name: option, exact: true }).click();
  }

  /** O input nativo fica oculto (sr-only) e a pessoa clica no rótulo desenhado — o teste faz o mesmo. */
  async check(label: string) {
    const checkbox = this.page.getByRole('checkbox', { name: label });
    await this.page.locator('label').filter({ has: checkbox }).click();
    await expect(checkbox).toBeChecked();
  }

  async toggleMoreOptions() {
    await this.page.getByRole('button', { name: 'Mais opções' }).click();
  }

  /** "Calcular" em quase todas; o comparador CLT x PJ usa "Comparar". */
  get submitButton(): Locator {
    return this.page.getByRole('button', { name: /^(Calcular|Comparar)$/ });
  }

  async submit() {
    await this.submitButton.click();
  }

  /**
   * Resultado da calculadora preenchida. A página também mostra "Exemplos" com os mesmos rótulos,
   * então tudo sobre o resultado é procurado só dentro deste bloco.
   */
  get result(): Locator {
    return this.page.locator('.calc-result');
  }

  /** Valor em destaque no topo do resultado. */
  get headline(): Locator {
    return this.result.getByTestId('result-headline');
  }

  /**
   * Linha do detalhamento (provento, desconto ou informação) pelo rótulo exato. As linhas ficam nas
   * seções do resultado; a legenda da barra de composição, no topo, repete rótulos como "INSS".
   */
  lineItem(label: string): Locator {
    return this.result
      .locator('section')
      .getByRole('listitem')
      .filter({ has: this.page.getByText(label, { exact: true }) });
  }

  /** Confere o valor em destaque e o rótulo do mesmo bloco (há calculadoras em que uma linha repete o rótulo). */
  async expectHeadline(label: string, value: string) {
    await expect(this.headline).toHaveText(value);
    await expect(this.headline.locator('xpath=..').getByText(label, { exact: true })).toBeVisible();
  }

  async expectLineItem(label: string, value: string) {
    await expect(this.lineItem(label)).toContainText(value);
  }

  async expectNoResult() {
    await expect(this.headline).toBeHidden();
  }

  async expectFieldError(message: string) {
    await expect(this.page.getByText(message, { exact: true })).toBeVisible();
  }
}
