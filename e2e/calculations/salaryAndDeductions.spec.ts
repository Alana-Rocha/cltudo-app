import { test } from '../fixtures';

/*
 * Valores esperados calculados à mão a partir da tabela de 2026 (src/rules/2026-01.ts), sem usar o motor do app:
 * INSS progressivo somando as faixas e arredondando uma vez; IRRF pela tabela mensal, com o redutor da
 * Lei 15.270/2025 (isenção total até R$ 5.000 e redução de R$ 978,62 − 0,133145 × renda até R$ 7.350).
 */

test.describe('Salário líquido', () => {
  test('R$ 6.000 sem dependentes: INSS R$ 641,51 e IRRF R$ 385,10 (com redutor)', async ({ calculator }) => {
    // INSS: 121,575 + 115,3656 + 174,1716 + 230,4022 = 641,5144
    // IRRF: (6.000 − 641,51) × 27,5% − 908,73 = 564,85; redutor 978,62 − 0,133145 × 6.000 = 179,75 → 385,10
    await calculator.open('calculadora-salario-liquido');
    await calculator.fill('Salário bruto', '6.000,00');

    await calculator.expectHeadline('Salário líquido', 'R$ 4.973,39');
    await calculator.expectLineItem('INSS', 'R$ 641,51');
    await calculator.expectLineItem('IRRF', 'R$ 385,10');
  });

  test('R$ 3.000 com 1 dependente e vale-transporte: VT limitado a 6% do salário', async ({ calculator }) => {
    // INSS 248,60; IRRF zero (desconto simplificado leva a base abaixo de R$ 2.428,80);
    // VT: 5,00 × 2 viagens × 22 dias = 220,00, limitado a 6% × 3.000 = 180,00
    await calculator.open('calculadora-salario-liquido');
    await calculator.fill('Salário bruto', '3.000,00');
    await calculator.fill('Número de dependentes', '1');
    await calculator.toggleMoreOptions();
    await calculator.check('Recebo vale-transporte');
    await calculator.fill('Valor da passagem (por trecho)', '5,00');

    await calculator.expectHeadline('Salário líquido', 'R$ 2.571,40');
    await calculator.expectLineItem('INSS', 'R$ 248,60');
    await calculator.expectLineItem('Vale-transporte', 'R$ 180,00');
  });
});

test.describe('INSS', () => {
  test('R$ 4.000: soma das três primeiras faixas = R$ 368,60', async ({ calculator }) => {
    // 1.621,00 × 7,5% + 1.281,84 × 9% + 1.097,16 × 12% = 121,575 + 115,3656 + 131,6592 = 368,5998
    await calculator.open('calculadora-inss');
    await calculator.fill('Salário de contribuição', '4.000,00');

    await calculator.expectHeadline('Desconto de INSS', 'R$ 368,60');
    await calculator.expectLineItem('Faixa 1 (7,5%)', 'R$ 121,58');
    await calculator.expectLineItem('Faixa 2 (9,0%)', 'R$ 115,37');
  });

  test('acima do teto: desconto máximo de R$ 988,09', async ({ calculator }) => {
    // 8.475,55 × 14% − 198,49 = 988,0870
    await calculator.open('calculadora-inss');
    await calculator.fill('Salário de contribuição', '10.000,00');

    await calculator.expectHeadline('Desconto de INSS', 'R$ 988,09');
  });
});

test.describe('IRRF', () => {
  test('R$ 6.000 sem dependentes: R$ 385,10 depois do redutor', async ({ calculator }) => {
    await calculator.open('calculadora-irrf');
    await calculator.fill('Rendimento tributável (mensal)', '6.000,00');

    await calculator.expectHeadline('IRRF retido na fonte', 'R$ 385,10');
  });

  test('R$ 10.000 com 2 dependentes: sem redutor, R$ 1.465,27', async ({ calculator }) => {
    // Base: 10.000 − 988,09 (INSS) − 2 × 189,59 = 8.632,73 → × 27,5% − 908,73 = 1.465,27
    await calculator.open('calculadora-irrf');
    await calculator.fill('Rendimento tributável (mensal)', '10.000,00');
    await calculator.fill('Número de dependentes', '2');

    await calculator.expectHeadline('IRRF retido na fonte', 'R$ 1.465,27');
  });

  test('até R$ 5.000: isento pelo redutor', async ({ calculator }) => {
    await calculator.open('calculadora-irrf');
    await calculator.fill('Rendimento tributável (mensal)', '5.000,00');

    await calculator.expectHeadline('IRRF retido na fonte', 'R$ 0,00');
  });
});

test.describe('Salário proporcional', () => {
  test('R$ 2.500 por 15 dias: R$ 1.250,00 bruto, sem arredondar o valor diário', async ({ calculator }) => {
    // 2.500 × 15 ÷ 30 = 1.250,00; INSS 1.250 × 7,5% = 93,75
    await calculator.open('calculadora-salario-proporcional');
    await calculator.fill('Salário mensal integral', '2.500,00');
    await calculator.fill('Dias trabalhados no mês', '15');

    await calculator.expectLineItem('Salário proporcional (15 dias)', 'R$ 1.250,00');
    await calculator.expectHeadline('Salário proporcional líquido', 'R$ 1.156,25');
  });
});

test.describe('Simulador de aumento', () => {
  test('10% sobre R$ 3.000: R$ 300 bruto viram R$ 264 no bolso', async ({ calculator }) => {
    // INSS de 3.300 = 284,60 e de 3.000 = 248,60 → +36,00; IRRF continua zero
    await calculator.open('calculadora-aumento-salarial');
    await calculator.fill('Salário bruto atual', '3.000,00');
    await calculator.fill('Aumento (%)', '10');

    await calculator.expectHeadline('Aumento líquido por mês', 'R$ 264,00');
    await calculator.expectLineItem('INSS a mais', 'R$ 36,00');
  });

  test('informando o novo salário dá o mesmo resultado que o percentual', async ({ calculator }) => {
    await calculator.open('calculadora-aumento-salarial');
    await calculator.fill('Salário bruto atual', '3.000,00');
    await calculator.choose('Como você quer informar o aumento?', 'Novo salário bruto');
    await calculator.fill('Novo salário bruto', '3.300,00');

    await calculator.expectHeadline('Aumento líquido por mês', 'R$ 264,00');
  });
});

test.describe('CLT x PJ', () => {
  test('CLT de R$ 10.000 contra PJ faturando R$ 15.000: PJ ganha R$ 53.821,98 a mais por ano', async ({ calculator }) => {
    // CLT/ano: 11 × 7.442,36 + férias 9.859,03 + 13º 7.442,36 + FGTS 10.666,67 = 109.834,02
    // PJ/ano (Anexo III com fator R): 180.000 − DAS 6% (10.800) − INSS do pró-labore 11% × 4.200,01 × 12 (5.544) = 163.656,00
    await calculator.open('calculadora-clt-x-pj');
    await calculator.fill('Salário bruto mensal', '10.000,00');
    await calculator.fill('Faturamento mensal', '15.000,00');

    await calculator.expectHeadline('Como PJ, você ganha a mais por ano', 'R$ 53.821,98');
    await calculator.expectLineItem('Total CLT por ano', 'R$ 109.834,02');
    await calculator.expectLineItem('Total PJ por ano', 'R$ 163.656,00');
  });
});
