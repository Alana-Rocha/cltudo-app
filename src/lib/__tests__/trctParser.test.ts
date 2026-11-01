import { describe, expect, it } from 'vitest';
import { parseTrctText } from '../trctParser';
import { toCents } from '../money';

// Texto como o pdf.js devolve um TRCT no modelo oficial: as verbas vêm em colunas, várias na mesma linha.
const OFFICIAL_LAYOUT = `
TERMO DE RESCISÃO DO CONTRATO DE TRABALHO
21 Tipo de Contrato 1. Contrato de trabalho por prazo indeterminado
22 Causa do Afastamento SJ2 - Despedida sem justa causa, pelo empregador
23 Remuneração Mês Anterior Afast. 3.000,00 24 Data de Admissão 01/03/2024 25 Data do Aviso Prévio 15/06/2026
26 Data de Afastamento 15/06/2026 27 Cód. Afastamento SJ2
DISCRIMINAÇÃO DAS VERBAS RESCISÓRIAS
VERBAS RESCISÓRIAS
Rubrica Valor Rubrica Valor Rubrica Valor
50 Saldo de 15 dias Salário 1.500,00 63 13º Salário Proporcional 6/12 avos 1.500,00 65 Férias Proporc. 5/12 avos 1.250,00
68 Terço Constitucional de Férias 416,67 69 Aviso Prévio Indenizado 3.600,00 70 13º Salário (Aviso Prévio Indenizado) 250,00
TOTAL RESCISÓRIO BRUTO 8.516,67
DEDUÇÕES
112.1 Previdência Social 112,50 112.2 Prev. Social - 13º Salário 133,19 114.1 IRRF 0,00
TOTAL DAS DEDUÇÕES 245,69
VALOR LÍQUIDO 8.270,98
`;

describe('parseTrctText', () => {
  it('lê as verbas, os descontos e o líquido do modelo oficial', () => {
    const reading = parseTrctText(OFFICIAL_LAYOUT);

    expect(reading.received).toEqual({
      balance: toCents(1500),
      thirteenth: toCents(1750), // 1.500 proporcional + 250 do aviso indenizado
      vacation: toCents(1666.67), // 1.250 + 416,67 do terço
      notice: toCents(3600),
      inss: toCents(245.69), // 112,50 do saldo + 133,19 do 13º
      irrf: 0,
      net: toCents(8270.98),
    });
  });

  it('lê as datas, a remuneração e a causa do afastamento', () => {
    const reading = parseTrctText(OFFICIAL_LAYOUT);

    expect(reading).toMatchObject({
      admissionDate: '01/03/2024',
      terminationDate: '15/06/2026',
      gross: toCents(3000),
      terminationType: 'without_cause',
    });
  });

  it('não depende da numeração dos campos, que muda entre modelos', () => {
    const reading = parseTrctText(`
      50 Saldo de Salário 1.500,00
      51 13º Salário Proporcional 1.750,00
      52 Férias Proporcionais 1.250,00 53 1/3 de Férias 416,67
      101 INSS 112,50 102 INSS sobre 13º Salário 133,19 103 IRRF sobre 13º 0,00
      Total Líquido 4.170,98
    `);

    expect(reading.received).toMatchObject({
      balance: toCents(1500),
      thirteenth: toCents(1750),
      vacation: toCents(1666.67),
      inss: toCents(245.69),
      net: toCents(4170.98),
    });
  });

  it('desconto do 13º adiantado não vira 13º recebido', () => {
    const reading = parseTrctText(`
      63 13º Salário Proporcional 7/12 avos 1.750,00
      115.1 Adiantamento de 13º Salário 1.000,00
    `);

    expect(reading.received.thirteenth).toBe(toCents(1750));
  });

  it('rótulo na linha seguinte a um total sem valor não é tratado como parte dele', () => {
    const reading = parseTrctText(`
      TOTAL RESCISÓRIO BRUTO —
      DEDUÇÕES
      112.1 Previdência Social 112,50 112.2 Prev. Social - 13º Salário 133,19
    `);

    expect(reading.received.inss).toBe(toCents(245.69));
  });

  it('totais bruto e de deduções não são somados a nenhuma verba', () => {
    const reading = parseTrctText(`
      69 Aviso Prévio Indenizado 3.600,00
      TOTAL RESCISÓRIO BRUTO 3.600,00
      112.1 Previdência Social 0,00
      TOTAL DAS DEDUÇÕES 0,00
    `);

    expect(reading.received).toEqual({ notice: toCents(3600), inss: 0 });
  });

  it.each([
    ['PD0 - Pedido de demissão', 'employee_resignation'],
    ['JC2 - Despedida por justa causa, pelo empregador', 'just_cause'],
    ['SJ2 - Despedida sem justa causa, pelo empregador', 'without_cause'],
    ['Rescisão por comum acordo (art. 484-A da CLT)', 'agreement'],
    ['Término do contrato de trabalho por prazo determinado', 'contract_end'],
  ])('causa "%s" vira o tipo de desligamento %s', (cause, type) => {
    expect(parseTrctText(`22 Causa do Afastamento ${cause}`).terminationType).toBe(type);
  });

  it('PDF escaneado (sem texto) não preenche nada', () => {
    expect(parseTrctText('')).toEqual({ received: {}, found: [] });
  });
});
