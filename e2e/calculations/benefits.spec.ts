import { expect, test } from '../fixtures';

/*
 * Cenários com salário de R$ 2.000 ou R$ 3.000: o IRRF fica zerado em qualquer leitura das regras
 * (o desconto simplificado já leva a base abaixo da faixa de isenção), então só o INSS é descontado.
 */

test.describe('Férias', () => {
  test('30 dias com salário de R$ 2.000: R$ 2.000,00 + 1/3, sem arredondar o valor diário', async ({ calculator }) => {
    // 2.000 + 666,67 = 2.666,67; INSS: 121,575 + 1.045,67 × 9% = 215,6853
    await calculator.open('calculadora-ferias');
    await calculator.fill('Salário bruto', '2.000,00');
    await calculator.fill('Dias de férias a gozar', '30');
    await calculator.fill('Dias de abono (venda)', '0');

    await calculator.expectLineItem('Férias gozadas (30 dias)', 'R$ 2.000,00');
    await calculator.expectLineItem('1/3 constitucional (gozadas)', 'R$ 666,67');
    await calculator.expectLineItem('INSS sobre férias', 'R$ 215,69');
    await calculator.expectHeadline('Valor líquido das férias', 'R$ 2.450,98');
  });

  test('vendendo 10 dias: abono e o 1/3 dele não pagam INSS', async ({ calculator }) => {
    // Gozadas 1.333,33 + 444,44 (INSS sobre 1.777,77 = 135,68); abono 666,67 + 222,22 isentos
    await calculator.open('calculadora-ferias');
    await calculator.fill('Salário bruto', '2.000,00');
    await calculator.fill('Dias de férias a gozar', '20');
    await calculator.fill('Dias de abono (venda)', '10');

    await calculator.expectLineItem('Abono pecuniário (10 dias)', 'R$ 666,67');
    await calculator.expectLineItem('1/3 do abono', 'R$ 222,22');
    await calculator.expectLineItem('INSS sobre férias', 'R$ 135,68');
    await calculator.expectHeadline('Valor líquido das férias', 'R$ 2.530,98');
  });

  test('R$ 2.556 com 6 dependentes: IRRF zerado e aviso explicando por quê', async ({ calculator }) => {
    // 2.556,00 + 852,00 = 3.408,00; INSS 3.408,00 × 12% − 111,40 = 297,56; líquido 3.110,44
    await calculator.open('calculadora-ferias');
    await calculator.fill('Salário bruto', '2.556,00');
    await expect(calculator.result.getByText(/os dependentes não alteram este valor/)).toHaveCount(0);

    await calculator.fill('Número de dependentes', '6');

    await calculator.expectLineItem('INSS sobre férias', 'R$ 297,56');
    await calculator.expectHeadline('Valor líquido das férias', 'R$ 3.110,44');
    await expect(calculator.result.getByText(/os dependentes não alteram este valor/)).toBeVisible();
  });
});

test.describe('13º salário', () => {
  test('ano completo com R$ 2.000: 1ª parcela sem descontos, INSS todo na 2ª', async ({ calculator }) => {
    // INSS sobre 2.000 = 155,685; 2ª parcela = 2.000 − 155,69 − 1.000 = 844,31
    await calculator.open('calculadora-13-salario');
    await calculator.fill('Salário bruto', '2.000,00');
    await calculator.fill('Meses trabalhados no ano', '12');

    await calculator.expectLineItem('1ª parcela (até 30/11)', 'R$ 1.000,00');
    await calculator.expectLineItem('INSS sobre o 13º', 'R$ 155,69');
    await calculator.expectLineItem('2ª parcela (até 20/12)', 'R$ 844,31');
    await calculator.expectHeadline('13º líquido (1ª + 2ª parcela)', 'R$ 1.844,31');
  });

  test('6 meses trabalhados: metade do salário', async ({ calculator }) => {
    // 2.000 × 6/12 = 1.000; INSS 1.000 × 7,5% = 75
    await calculator.open('calculadora-13-salario');
    await calculator.fill('Salário bruto', '2.000,00');
    await calculator.fill('Meses trabalhados no ano', '6');

    await calculator.expectLineItem('13º integral', 'R$ 1.000,00');
    await calculator.expectHeadline('13º líquido (1ª + 2ª parcela)', 'R$ 925,00');
  });
});

test.describe('Salário-maternidade', () => {
  test('120 dias com R$ 3.000: 4 meses menos o INSS de cada mês', async ({ calculator }) => {
    // 4 × 3.000 = 12.000; INSS mensal 248,60 × 4 = 994,40
    await calculator.open('calculadora-salario-maternidade');
    await calculator.fill('Remuneração mensal integral (empregada CLT)', '3.000,00');

    await calculator.expectLineItem('INSS por mês', 'R$ 248,60');
    await calculator.expectHeadline('Total líquido do benefício', 'R$ 11.005,60');
  });

  test('Empresa Cidadã: 180 dias, 6 meses de benefício', async ({ calculator }) => {
    // 6 × 3.000 − 6 × 248,60 = 16.508,40
    await calculator.open('calculadora-salario-maternidade');
    await calculator.fill('Remuneração mensal integral (empregada CLT)', '3.000,00');
    await calculator.check('Empresa participa do Programa Empresa Cidadã (180 dias)');

    await calculator.expectHeadline('Total líquido do benefício', 'R$ 16.508,40');
  });
});
