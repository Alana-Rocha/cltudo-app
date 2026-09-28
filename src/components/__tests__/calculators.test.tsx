import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SalaryCalculator } from '@/components/calculators/SalaryCalculator';
import { TerminationCalculator } from '@/components/calculators/TerminationCalculator';
import { VacationCalculator } from '@/components/calculators/VacationCalculator';
import { CalculatorDirectory } from '@/components/shared/CalculatorDirectory';
import { calculateSalary } from '@/engine/salary';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';
import { formatCurrency } from '@/lib/format';

beforeAll(() => {
  // jsdom não implementa scrollIntoView, usado ao clicar em Calcular.
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => localStorage.clear());
afterEach(cleanup);

// formatCurrency usa espaço não separável; o Testing Library normaliza o texto da página para espaço comum.
function money(cents: number) {
  return formatCurrency(cents).replace(/\s/g, ' ');
}

function type(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe('SalaryCalculator', () => {
  it('mostra o salário líquido ao vivo, sem clicar em Calcular', () => {
    render(<SalaryCalculator />);
    type(/Salário bruto/, '600000');

    const expected = calculateSalary({ grossSalary: toCents(6000), dependents: 0 }, getRulesFor(new Date()));
    expect(screen.getByText('Salário líquido')).toBeTruthy();
    expect(screen.getAllByText(money(expected.totals.net)).length).toBeGreaterThan(0);
  });

  it('só mostra o erro de campo vazio depois do submit', () => {
    render(<SalaryCalculator />);
    expect(screen.queryByText(/Informe um salário bruto/)).toBeNull();

    fireEvent.submit(screen.getByRole('button', { name: 'Calcular' }).closest('form')!);
    expect(screen.getByText(/Informe um salário bruto/)).toBeTruthy();
  });

  it('valores de um link compartilhado têm prioridade sobre os salvos no navegador', async () => {
    localStorage.setItem('calculadora-salario-liquido:gross', JSON.stringify('1.000,00'));
    const shared = btoa(JSON.stringify({ 'calculadora-salario-liquido:gross': '6.000,00' }));
    window.history.replaceState(null, '', `/calculadora-salario-liquido?dados=${shared}`);

    render(<SalaryCalculator />);
    const input = (await screen.findByLabelText(/Salário bruto/)) as HTMLInputElement;
    await screen.findByText('Salário líquido');
    expect(input.value).toBe('6.000,00');
    await new Promise((r) => setTimeout(r, 0));
    expect(window.location.search).toBe('');
  });

  it('restaura o resultado dos dados salvos ao recarregar', async () => {
    localStorage.setItem('calculadora-salario-liquido:gross', JSON.stringify('3.000,00'));
    render(<SalaryCalculator />);
    expect(await screen.findByText('Salário líquido')).toBeTruthy();
  });
});

describe('TerminationCalculator', () => {
  function fillDates(admission: string, termination: string) {
    type(/Data de admissão/, admission);
    type(/Data de desligamento/, termination);
    type(/^Salário bruto/, '300000');
  }

  it('mostra o erro de data no próprio campo, não no salário', () => {
    render(<TerminationCalculator />);
    type(/^Salário bruto/, '300000');
    fireEvent.submit(screen.getByRole('button', { name: 'Calcular' }).closest('form')!);

    const admission = screen.getByLabelText(/Data de admissão/);
    expect(admission.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByLabelText(/^Salário bruto/).getAttribute('aria-invalid')).toBe('false');
  });

  it('desligamento antes das regras disponíveis mostra erro em vez de quebrar', () => {
    render(<TerminationCalculator />);
    fillDates('01/03/2024', '20/12/2025');
    fireEvent.submit(screen.getByRole('button', { name: 'Calcular' }).closest('form')!);

    expect(screen.getByText(/só há regras de INSS e IRRF/)).toBeTruthy();
  });

  it('"não cumprido" some da conta ao trocar o pedido de demissão por outro tipo', () => {
    render(<TerminationCalculator />);
    fillDates('01/03/2026', '20/08/2026');
    const pick = (label: RegExp, option: string) => {
      fireEvent.click(screen.getByRole('combobox', { name: label }));
      fireEvent.click(screen.getByRole('option', { name: option }));
    };
    pick(/Tipo de desligamento/, 'Pedido de demissão');
    pick(/Aviso prévio/, 'Não cumprido pelo empregado');
    expect(screen.getByText('Desconto de aviso prévio não cumprido')).toBeTruthy();

    pick(/Tipo de desligamento/, 'Sem justa causa (empregador)');
    expect(screen.queryByText('Desconto de aviso prévio não cumprido')).toBeNull();
    expect(screen.getByRole('combobox', { name: /Aviso prévio/ }).textContent).toContain('Indenizado');
  });

  it('férias vencidas só entram quando a pessoa marca que tem', () => {
    render(<TerminationCalculator />);
    fillDates('01/03/2026', '20/08/2026');
    expect(screen.queryByText(/Férias vencidas \(/)).toBeNull();

    fireEvent.click(screen.getByLabelText(/Tenho férias vencidas/));
    expect(screen.getByText('Férias vencidas (30 dias)')).toBeTruthy();
  });

  it('média de variáveis entra no aviso prévio indenizado', () => {
    render(<TerminationCalculator />);
    fillDates('01/03/2026', '20/08/2026');
    type(/Média mensal de variáveis/, '60000');

    expect(screen.getAllByText(money(toCents(3600))).length).toBeGreaterThan(0);
  });
});

describe('VacationCalculator', () => {
  it('erro de dias vendidos aparece no campo de abono, em português', () => {
    render(<VacationCalculator />);
    type(/^Salário bruto/, '300000');
    type(/Dias de férias a gozar/, '25');
    type(/Dias de abono/, '10');
    fireEvent.submit(screen.getByRole('button', { name: 'Calcular' }).closest('form')!);

    expect(screen.getByLabelText(/Dias de abono/).getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText(/não pode ultrapassar 30/)).toBeTruthy();
  });
});

describe('CalculatorDirectory', () => {
  it('busca ignora acentos e esconde categorias vazias', () => {
    render(<CalculatorDirectory rulesLabel="janeiro de 2026" />);
    fireEvent.change(screen.getByLabelText('Buscar calculadora'), { target: { value: 'ferias' } });

    expect(screen.getByText('Férias')).toBeTruthy();
    expect(screen.queryByText('Rescisão')).toBeNull();
    expect(screen.queryByText('Desligamento')).toBeNull();
  });

  it('mostra mensagem quando nada é encontrado', () => {
    render(<CalculatorDirectory rulesLabel="janeiro de 2026" />);
    fireEvent.change(screen.getByLabelText('Buscar calculadora'), { target: { value: 'xyz' } });
    expect(screen.getByText(/Nenhuma calculadora encontrada/)).toBeTruthy();
  });
});
