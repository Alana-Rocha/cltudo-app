import { expect, test } from './fixtures';

test.describe('Campos', () => {
  test('moeda: os dígitos viram centavos, com separador de milhar', async ({ calculator }) => {
    await calculator.open('calculadora-salario-liquido');
    const gross = calculator.field('Salário bruto');

    await gross.pressSequentially('123456');
    await expect(gross).toHaveValue('1.234,56');

    await gross.fill('abc');
    await expect(gross).toHaveValue('');
  });

  test('data: a máscara insere as barras enquanto se digita', async ({ calculator }) => {
    await calculator.open('calculadora-aviso-previo');
    const admission = calculator.field('Data de admissão');

    await admission.pressSequentially('01032020');
    await expect(admission).toHaveValue('01/03/2020');
  });

  test('número: os botões − e + respeitam o mínimo e o máximo', async ({ calculator }) => {
    await calculator.open('calculadora-ferias');
    const sold = calculator.field('Dias de abono (venda)');
    // Os botões − e + ficam ao lado do campo, dentro do mesmo contêiner.
    const increase = sold.locator('xpath=..').getByRole('button', { name: 'Aumentar' });
    const decrease = sold.locator('xpath=..').getByRole('button', { name: 'Diminuir' });

    await sold.fill('10');
    await expect(increase).toBeDisabled();
    await sold.fill('0');
    await expect(decrease).toBeDisabled();
    await increase.click();
    await expect(sold).toHaveValue('1');
  });

  test('número fora do limite mostra o aviso no próprio campo', async ({ calculator }) => {
    await calculator.open('calculadora-ferias');
    await calculator.fill('Dias de abono (venda)', '15');

    await calculator.expectFieldError('Use no máximo 10.');
  });
});

test.describe('Mensagens de erro ao calcular', () => {
  test('não mostra erro antes de a pessoa tentar calcular', async ({ page, calculator }) => {
    await calculator.open('calculadora-salario-liquido');

    await expect(page.getByText('Informe um salário bruto maior que zero.')).toBeHidden();
    await calculator.expectNoResult();
  });

  const requiredFieldCases = [
    { slug: 'calculadora-salario-liquido', message: 'Informe um salário bruto maior que zero.' },
    { slug: 'calculadora-inss', message: 'Informe um salário maior que zero.' },
    { slug: 'calculadora-irrf', message: 'Informe um rendimento maior que zero.' },
    { slug: 'calculadora-13-salario', message: 'Informe um salário bruto maior que zero.' },
    { slug: 'calculadora-ferias', message: 'Informe um salário bruto maior que zero.' },
    { slug: 'calculadora-hora-extra', message: 'Informe um salário bruto maior que zero.' },
    { slug: 'calculadora-dsr', message: 'Informe um valor de remuneração variável maior que zero.' },
    { slug: 'calculadora-seguro-desemprego', message: 'Informe os 3 últimos salários, todos maiores que zero.' },
    { slug: 'calculadora-clt-x-pj', message: 'Informe o salário bruto da proposta CLT.' },
    { slug: 'calculadora-aumento-salarial', message: 'Informe o salário bruto atual.' },
    { slug: 'calculadora-aviso-previo', message: 'Informe a data de admissão no formato dd/mm/aaaa.' },
  ];

  for (const { slug, message } of requiredFieldCases) {
    test(`${slug}: formulário vazio pede o campo obrigatório`, async ({ calculator }) => {
      await calculator.open(slug);
      await calculator.submit();

      await calculator.expectFieldError(message);
      await calculator.expectNoResult();
    });
  }

  test('o campo com erro fica marcado como inválido para leitores de tela', async ({ calculator }) => {
    await calculator.open('calculadora-salario-liquido');
    await calculator.submit();

    await expect(calculator.field('Salário bruto')).toHaveAttribute('aria-invalid', 'true');
    await expect(calculator.field('Salário bruto')).toHaveAccessibleDescription('Informe um salário bruto maior que zero.');
  });

  test('o erro some assim que o campo é corrigido', async ({ page, calculator }) => {
    await calculator.open('calculadora-salario-liquido');
    await calculator.submit();
    await calculator.fill('Salário bruto', '3.000,00');

    await expect(page.getByText('Informe um salário bruto maior que zero.')).toBeHidden();
    await expect(calculator.headline).toBeVisible();
  });
});

test.describe('Regras de negócio nos formulários', () => {
  test('rescisão: desligamento antes da admissão', async ({ calculator }) => {
    await calculator.open('calculadora-rescisao');
    await calculator.fill('Data de admissão', '01/03/2026');
    await calculator.fill('Data de desligamento', '01/02/2026');
    await calculator.fill('Salário bruto', '3.000,00');
    await calculator.submit();

    await calculator.expectFieldError('A data de desligamento deve ser depois da admissão.');
    await calculator.expectNoResult();
  });

  test('rescisão: data que não existe no calendário', async ({ calculator }) => {
    await calculator.open('calculadora-rescisao');
    await calculator.fill('Data de admissão', '01/03/2024');
    await calculator.fill('Data de desligamento', '31/02/2026');
    await calculator.submit();

    await calculator.expectFieldError('Informe a data de desligamento no formato dd/mm/aaaa.');
  });

  test('rescisão: desligamento antes das regras disponíveis avisa em vez de calcular errado', async ({ page, calculator }) => {
    await calculator.open('calculadora-rescisao');
    await calculator.fill('Data de admissão', '01/03/2020');
    await calculator.fill('Data de desligamento', '15/06/2023');
    await calculator.fill('Salário bruto', '3.000,00');
    await calculator.submit();

    await expect(page.getByText(/Por enquanto só há regras de INSS e IRRF a partir de 01\/01\/2024/)).toBeVisible();
    await calculator.expectNoResult();
  });

  test('férias: dias gozados + vendidos não passam de 30', async ({ calculator }) => {
    await calculator.open('calculadora-ferias');
    await calculator.fill('Salário bruto', '3.000,00');
    await calculator.fill('Dias de férias a gozar', '25');
    await calculator.fill('Dias de abono (venda)', '10');
    await calculator.submit();

    await calculator.expectFieldError('Dias gozados + dias vendidos não pode ultrapassar 30.');
    await calculator.expectNoResult();
  });

  test('aumento: novo salário precisa ser maior que o atual', async ({ calculator }) => {
    await calculator.open('calculadora-aumento-salarial');
    await calculator.fill('Salário bruto atual', '3.000,00');
    await calculator.choose('Como você quer informar o aumento?', 'Novo salário bruto');
    await calculator.fill('Novo salário bruto', '2.500,00');
    await calculator.submit();

    await calculator.expectFieldError('O novo salário precisa ser maior que o atual.');
    await calculator.expectNoResult();
  });

  test('CLT x PJ: pede o faturamento quando só o salário foi preenchido', async ({ calculator }) => {
    await calculator.open('calculadora-clt-x-pj');
    await calculator.fill('Salário bruto mensal', '10.000,00');
    await calculator.submit();

    await calculator.expectFieldError('Informe o faturamento mensal da proposta PJ.');
  });
});

test.describe('Seleção (combobox)', () => {
  test('funciona pelo teclado: abre, navega com as setas e confirma com Enter', async ({ page, calculator }) => {
    await calculator.open('calculadora-insalubridade');
    const grade = page.getByRole('combobox', { name: 'Grau de insalubridade' });

    await grade.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect(grade).toHaveText(/Máximo \(40%\)/);
    await calculator.expectHeadline('Adicional de insalubridade (mensal)', 'R$ 648,40');
  });

  test('Esc fecha a lista sem mudar a escolha', async ({ page, calculator }) => {
    await calculator.open('calculadora-insalubridade');
    const grade = page.getByRole('combobox', { name: 'Grau de insalubridade' });

    await grade.click();
    await page.keyboard.press('Escape');

    await expect(page.getByRole('listbox')).toBeHidden();
    await expect(grade).toHaveText(/Médio \(20%\)/);
  });
});
