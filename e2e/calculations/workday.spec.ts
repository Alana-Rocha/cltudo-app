import { expect, test } from '../fixtures';

test.describe('Hora extra', () => {
  test('R$ 2.200 / 220h: 10h a 50% e 2h a 100%, com DSR sobre o total', async ({ calculator }) => {
    // Valor-hora 10,00 → 150,00 + 40,00 = 190,00; DSR = 190 × 8 ÷ 22 = 69,0909
    await calculator.open('calculadora-hora-extra');
    await calculator.fill('Salário bruto', '2.200,00');
    await calculator.fill('Jornada mensal (horas)', '220');
    await calculator.fill('Horas extras a 50%', '10');
    await calculator.fill('Horas extras a 100%', '2');
    await calculator.fill('Dias úteis no mês', '22');
    await calculator.fill('Domingos + feriados no mês', '8');

    await calculator.expectLineItem('Hora extra 50% (10h)', 'R$ 150,00');
    await calculator.expectLineItem('Hora extra 100% (2h)', 'R$ 40,00');
    await calculator.expectLineItem('DSR sobre horas extras', 'R$ 69,09');
    await calculator.expectHeadline('Horas extras + DSR', 'R$ 259,09');
  });

  test('não arredonda o valor-hora: R$ 3.000 ÷ 220 × 1,5 × 40h = R$ 818,18', async ({ calculator }) => {
    await calculator.open('calculadora-hora-extra');
    await calculator.fill('Salário bruto', '3.000,00');
    await calculator.fill('Jornada mensal (horas)', '220');
    await calculator.fill('Horas extras a 50%', '40');
    await calculator.fill('Horas extras a 100%', '0');
    await calculator.fill('Domingos + feriados no mês', '0');

    await calculator.expectLineItem('Hora extra 50% (40h)', 'R$ 818,18');
  });
});

test.describe('DSR', () => {
  test('R$ 1.000 em comissões, 22 dias úteis e 8 domingos/feriados: R$ 363,64', async ({ calculator }) => {
    // 1.000 × 8 ÷ 22 = 363,6363
    await calculator.open('calculadora-dsr');
    await calculator.fill('Remuneração variável no mês (comissões, etc.)', '1.000,00');
    await calculator.fill('Dias úteis no mês', '22');
    await calculator.fill('Domingos + feriados', '8');

    await calculator.expectLineItem('DSR sobre a remuneração variável', 'R$ 363,64');
    await calculator.expectHeadline('Variáveis + DSR', 'R$ 1.363,64');
  });
});

test.describe('Adicional noturno', () => {
  test('10h noturnas viram 11,43h pela hora reduzida de 52min30s, mais 20%', async ({ calculator }) => {
    // 10 × 60 ÷ 52,5 × 10,00 = 114,2857; adicional 20% = 22,8571
    await calculator.open('calculadora-adicional-noturno');
    await calculator.fill('Salário bruto', '2.200,00');
    await calculator.fill('Jornada mensal (horas)', '220');
    await calculator.fill('Horas trabalhadas no período noturno (22h–5h)', '10');

    await calculator.expectLineItem('Horas noturnas (convertidas pela hora reduzida)', 'R$ 114,29');
    await calculator.expectLineItem('Adicional noturno (20%)', 'R$ 22,86');
    await calculator.expectHeadline('Total com adicional noturno', 'R$ 137,15');
  });
});

test.describe('Insalubridade', () => {
  test('grau médio sobre o salário mínimo: 20% × R$ 1.621,00', async ({ calculator }) => {
    await calculator.open('calculadora-insalubridade');

    await calculator.expectHeadline('Adicional de insalubridade (mensal)', 'R$ 324,20');
  });

  test('grau máximo com base de cálculo própria: 40% × R$ 3.000', async ({ calculator }) => {
    await calculator.open('calculadora-insalubridade');
    await calculator.choose('Grau de insalubridade', 'Máximo (40%)');
    await calculator.fill('Base de cálculo (opcional — padrão: salário mínimo)', '3.000,00');

    await calculator.expectHeadline('Adicional de insalubridade (mensal)', 'R$ 1.200,00');
  });
});

test.describe('Periculosidade', () => {
  test('30% sobre o salário base', async ({ calculator }) => {
    await calculator.open('calculadora-periculosidade');
    await calculator.fill('Salário base (sem gratificações)', '3.000,00');

    await calculator.expectHeadline('Adicional de periculosidade (mensal)', 'R$ 900,00');
  });
});

test.describe('Banco de horas', () => {
  test('saldo positivo de 10h pago como hora extra a 50%', async ({ calculator }) => {
    await calculator.open('calculadora-banco-de-horas');
    await calculator.fill('Salário bruto', '2.200,00');
    await calculator.fill('Jornada mensal (horas)', '220');
    await calculator.fill('Saldo de horas (negativo se você deve horas)', '10');

    await calculator.expectHeadline('Valor a receber pelo banco de horas', 'R$ 150,00');
  });

  test('saldo negativo: mostra as horas devidas e nada a receber', async ({ calculator }) => {
    await calculator.open('calculadora-banco-de-horas');
    await calculator.fill('Salário bruto', '2.200,00');
    await calculator.fill('Saldo de horas (negativo se você deve horas)', '-5');

    await calculator.expectLineItem('Saldo de horas devidas pelo empregado', '5h');
    await expect(calculator.lineItem('Valor se pago como hora extra (50%)')).toHaveCount(0);
  });
});
