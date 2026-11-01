import { expect, test } from '../fixtures';

test.describe('Rescisão', () => {
  test('sem justa causa com aviso indenizado: verbas e avos pela data projetada', async ({ calculator }) => {
    // Admissão 01/03/2024, saída 15/06/2026: 2 anos completos → aviso de 36 dias, projeta até 21/07/2026.
    // 13º: jan a jul/2026 = 7/12. Férias: período em curso desde 01/03/2026 → mar a jul = 5/12.
    await calculator.open('calculadora-rescisao');
    await calculator.fill('Data de admissão', '01/03/2024');
    await calculator.fill('Data de desligamento', '15/06/2026');
    await calculator.fill('Salário bruto', '3.000,00');

    await expect(calculator.field('Dias trabalhados no mês do desligamento')).toHaveValue('15');
    await calculator.expectLineItem('Saldo de salário', 'R$ 1.500,00');
    await calculator.expectLineItem('Aviso prévio indenizado', 'R$ 3.600,00');
    await calculator.expectLineItem('13º proporcional', '7/12 avos');
    await calculator.expectLineItem('13º proporcional', 'R$ 1.750,00');
    await calculator.expectLineItem('Férias proporcionais', '5/12 avos');
    await calculator.expectLineItem('Férias proporcionais', 'R$ 1.250,00');
    await calculator.expectLineItem('1/3 sobre férias proporcionais', 'R$ 416,67');
    // INSS: 1.500 × 7,5% = 112,50; 13º: 121,575 + 129,00 × 9% = 133,185
    await calculator.expectLineItem('INSS sobre saldo de salário', 'R$ 112,50');
    await calculator.expectLineItem('INSS sobre o 13º', 'R$ 133,19');
  });

  test('justa causa: sem aviso prévio, sem 13º e sem multa do FGTS', async ({ calculator }) => {
    await calculator.open('calculadora-rescisao');
    await calculator.fill('Data de admissão', '01/03/2024');
    await calculator.fill('Data de desligamento', '15/06/2026');
    await calculator.fill('Salário bruto', '3.000,00');
    await calculator.choose('Tipo de desligamento', 'Justa causa');

    await calculator.expectLineItem('Saldo de salário', 'R$ 1.500,00');
    await expect(calculator.lineItem('Aviso prévio indenizado')).toHaveCount(0);
    await expect(calculator.lineItem('Multa do FGTS (40%)')).toHaveCount(0);
    await expect(calculator.result.getByText('13º proporcional: não devido em dispensa por justa causa.')).toBeVisible();
  });

  test('férias vencidas em dobro somam principal + 1/3, × 2', async ({ calculator }) => {
    // 30 dias de R$ 3.000: (3.000 + 1.000) × 2 = 8.000
    await calculator.open('calculadora-rescisao');
    await calculator.fill('Data de admissão', '01/03/2024');
    await calculator.fill('Data de desligamento', '15/06/2026');
    await calculator.fill('Salário bruto', '3.000,00');
    await calculator.check('Tenho férias vencidas');
    await calculator.fill('Dias a receber (vencidos)', '30');
    await calculator.check('Período concessivo (12 meses após vencer) já expirou — pagar em dobro (Súmula 450 TST)');

    await calculator.expectLineItem('Férias vencidas (30 dias), em dobro', 'R$ 8.000,00');
  });
});

test.describe('Aviso prévio', () => {
  test('6 anos completos: 30 + 6 × 3 = 48 dias, projetando o contrato até 19/07/2026', async ({ calculator }) => {
    await calculator.open('calculadora-aviso-previo');
    await calculator.fill('Data de admissão', '01/03/2020');
    await calculator.fill('Data de desligamento', '01/06/2026');

    await calculator.expectLineItem('Total de dias de aviso', '48 dias');
    await calculator.expectLineItem('Data projetada de término do contrato', '19/07/2026');
  });

  test('pedido de demissão: sempre 30 dias, sem acréscimo por tempo de serviço', async ({ calculator }) => {
    await calculator.open('calculadora-aviso-previo');
    await calculator.fill('Data de admissão', '01/03/2020');
    await calculator.fill('Data de desligamento', '01/06/2026');
    await calculator.choose('Motivo', 'Pedido de demissão');

    await calculator.expectLineItem('Total de dias de aviso', '30 dias');
    await calculator.expectLineItem('Data projetada de término do contrato', '01/07/2026');
  });
});

test.describe('FGTS', () => {
  test('depósito mensal é 8% do salário', async ({ calculator }) => {
    await calculator.open('calculadora-fgts');
    await calculator.fill('Salário bruto', '3.000,00');

    await calculator.expectHeadline('Depósito mensal do FGTS', 'R$ 240,00');
  });

  test('multa de 40% sobre o saldo estimado de 24 meses', async ({ calculator }) => {
    // Saldo estimado: 24 × 240 (salários) + 2 × 240 (13º) = 6.240 → multa 2.496
    await calculator.open('calculadora-fgts');
    await calculator.fill('Salário bruto', '3.000,00');
    await calculator.check('Também quero estimar a multa rescisória');
    await calculator.fill('Meses de contrato', '24');

    await calculator.expectLineItem('Saldo do FGTS (estimado)', 'R$ 6.240,00');
    await calculator.expectLineItem('Multa rescisória (40%)', 'R$ 2.496,00');
  });
});

test.describe('Seguro-desemprego', () => {
  async function fillSalaries(calculator: import('../pages/CalculatorPage').CalculatorPage, value: string) {
    await calculator.fill('Salário 1', value);
    await calculator.fill('Salário 2', value);
    await calculator.fill('Salário 3', value);
  }

  test('média baixa: 80% fica abaixo do mínimo, então a parcela é o piso de R$ 1.621,00', async ({ calculator }) => {
    await calculator.open('calculadora-seguro-desemprego');
    await fillSalaries(calculator, '2.000,00');
    await calculator.fill('Meses trabalhados no período exigido', '12');

    await calculator.expectLineItem('Valor de cada parcela', 'R$ 1.621,00');
    await calculator.expectHeadline('Total do seguro-desemprego', 'R$ 6.484,00');
  });

  test('faixa 2 com 24 meses: 1.777,74 + 50% do que passa de 2.222,17, em 5 parcelas', async ({ calculator }) => {
    // 1.777,74 + (3.000 − 2.222,17) × 50% = 2.166,655 → 2.166,66 × 5 = 10.833,30
    await calculator.open('calculadora-seguro-desemprego');
    await fillSalaries(calculator, '3.000,00');
    await calculator.fill('Meses trabalhados no período exigido', '24');

    await calculator.expectLineItem('Valor de cada parcela', 'R$ 2.166,66');
    await calculator.expectHeadline('Total do seguro-desemprego', 'R$ 10.833,30');
  });

  test('média acima de R$ 3.703,99: parcela fixa no teto de R$ 2.518,65', async ({ calculator }) => {
    await calculator.open('calculadora-seguro-desemprego');
    await fillSalaries(calculator, '5.000,00');
    await calculator.fill('Meses trabalhados no período exigido', '12');

    await calculator.expectLineItem('Valor de cada parcela', 'R$ 2.518,65');
    await calculator.expectHeadline('Total do seguro-desemprego', 'R$ 10.074,60');
  });
});
