import { expect, test } from '../fixtures';

test.describe('Custo do funcionário', () => {
  test('Simples Nacional: salário + provisões de 13º e férias + FGTS', async ({ calculator }) => {
    // 3.000 + 250,00 (13º) + 333,33 (férias + 1/3) + 8% × 3.583,33 (286,67) = 3.870,00
    await calculator.open('calculadora-custo-funcionario');
    await calculator.fill('Salário bruto do funcionário', '3.000,00');

    await calculator.expectLineItem('13º salário (provisão mensal)', 'R$ 250,00');
    await calculator.expectLineItem('Férias + 1/3 (provisão mensal)', 'R$ 333,33');
    await calculator.expectLineItem('FGTS (8%)', 'R$ 286,67');
    await calculator.expectHeadline('Custo mensal para a empresa', 'R$ 3.870,00');
  });

  test('Lucro Presumido ou Real: soma INSS patronal, RAT e terceiros sobre a mesma base', async ({ calculator }) => {
    // Base 3.583,33: 20% = 716,67; RAT 2% = 71,67; terceiros 5,8% = 207,83 → 3.870,00 + 996,17
    await calculator.open('calculadora-custo-funcionario');
    await calculator.fill('Salário bruto do funcionário', '3.000,00');
    await calculator.choose('Regime tributário da empresa', 'Lucro Presumido ou Lucro Real');

    await expect(calculator.page.getByRole('combobox', { name: 'Grau de risco da atividade (RAT)' })).toHaveText(/Médio \(2%\)/);
    await calculator.expectLineItem('INSS patronal (20%)', 'R$ 716,67');
    await calculator.expectLineItem('RAT (2%)', 'R$ 71,67');
    await calculator.expectLineItem('Terceiros (5,8%)', 'R$ 207,83');
    await calculator.expectHeadline('Custo mensal para a empresa', 'R$ 4.866,17');
  });
});
