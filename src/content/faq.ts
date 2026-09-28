import type { RuleSet } from '@/rules/schema';
import { formatCurrency, formatPercent } from '@/lib/format';
import type { FaqItem } from '@/components/shared/Faq';

export function getFaqFor(slug: string, rules: RuleSet): FaqItem[] {
  const gen = FAQ_BY_SLUG[slug];
  return gen ? gen(rules) : [];
}

const FAQ_BY_SLUG: Record<string, (rules: RuleSet) => FaqItem[]> = {
  'calculadora-salario-liquido': (r) => [
    {
      question: 'Como é calculado o salário líquido?',
      answer: 'Salário líquido é o salário bruto menos o INSS, menos o IRRF e menos outros descontos autorizados (como pensão alimentícia ou vale-transporte).',
    },
    {
      question: 'O INSS é descontado sobre o salário todo?',
      answer: `O desconto é progressivo por faixas: cada faixa da tabela paga sua própria alíquota, só sobre a parte do salário que cai nela, até o teto de ${formatCurrency(r.inss.ceiling)}.`,
    },
    {
      question: 'Quando o IRRF é zerado?',
      answer: `Desde a reforma vigente a partir de 2026, quem tem rendimento tributável até ${formatCurrency(r.irrf.reducer.fullExemptionUpTo)} fica isento de Imposto de Renda.`,
    },
    {
      question: 'O que é o desconto simplificado do IRRF?',
      answer: `É uma dedução fixa de ${formatCurrency(r.irrf.simplifiedDiscount)} que substitui as deduções de INSS, dependentes e pensão, usada quando é mais vantajosa.`,
    },
    {
      question: 'O vale-transporte pode ser descontado do salário todo?',
      answer: `Não. O desconto de vale-transporte é limitado a ${formatPercent(r.salary.transportVoucherMaxRate, 0)} do salário base.`,
    },
  ],
  'calculadora-rescisao': (r) => [
    {
      question: 'Quais verbas eu recebo em qualquer tipo de desligamento?',
      answer: 'Saldo de salário e férias proporcionais + 1/3 são devidos mesmo em dispensa por justa causa. As demais verbas dependem do tipo de desligamento.',
    },
    {
      question: 'O aviso prévio sempre projeta o contrato?',
      answer: 'Só quando é indenizado: o período do aviso conta para os avos de 13º e férias, mesmo sem trabalho efetivo nesses dias.',
    },
    {
      question: 'Justa causa dá direito a 13º proporcional?',
      answer: 'Não. Na dispensa por justa causa, o 13º proporcional não é devido, mas o saldo de salário e as férias proporcionais continuam sendo.',
    },
    {
      question: 'Como funciona a multa do FGTS no acordo (art. 484-A)?',
      answer: `No acordo entre empresa e empregado, a multa do FGTS é de ${formatPercent(r.fgts.fineRates.agreement, 0)} (em vez de ${formatPercent(r.fgts.fineRates.withoutCause, 0)} da dispensa sem justa causa), e o saque é limitado a ${formatPercent(r.fgts.withdrawalRates.agreement, 0)} do saldo.`,
    },
    {
      question: 'A multa do FGTS calculada aqui é exata?',
      answer: 'Só quando você informa o saldo real do FGTS. Sem ele, o valor é uma estimativa que não reproduz reajustes salariais ao longo do contrato.',
    },
  ],
  'calculadora-ferias': (r) => [
    {
      question: 'Como é calculado o valor das férias?',
      answer: 'O salário é dividido por 30 e multiplicado pelos dias de férias gozados, mais 1/3 constitucional sobre esse valor.',
    },
    {
      question: 'Quantos dias de férias posso vender?',
      answer: `Até ${Math.floor(30 * r.vacation.maxSoldFraction)} dos 30 dias de férias, no chamado abono pecuniário.`,
    },
    {
      question: 'O abono pecuniário paga INSS e IRRF?',
      answer: 'Não. O abono e o 1/3 sobre ele são isentos de INSS e de Imposto de Renda — só as férias efetivamente gozadas sofrem esses descontos.',
    },
    {
      question: 'Posso dividir minhas férias em mais de um período?',
      answer: `Sim, em até ${r.vacation.split.maxPeriods} períodos, sendo que um deles precisa ter pelo menos ${r.vacation.split.minLongestDays} dias e os demais pelo menos ${r.vacation.split.minOtherDays} dias cada.`,
    },
    {
      question: 'Faltas injustificadas reduzem os dias de férias?',
      answer: 'Sim, conforme a escala do art. 130 da CLT: quanto mais faltas injustificadas no período aquisitivo, menos dias de férias você tem direito.',
    },
  ],
  'calculadora-13-salario': (r) => [
    {
      question: 'Como são contados os avos do 13º?',
      answer: `Cada mês com ${r.thirteenth.minDaysForMonth} dias ou mais trabalhados conta como 1/12 do 13º, até o máximo de 12/12.`,
    },
    {
      question: 'A 1ª parcela tem desconto de INSS e IRRF?',
      answer: `Não. A 1ª parcela, de ${formatPercent(r.thirteenth.firstInstallmentRate, 0)} do valor integral, é paga sem nenhum desconto.`,
    },
    {
      question: 'O INSS e o IRRF do 13º são somados ao salário do mês?',
      answer: 'Não. O 13º tem tributação exclusiva, separada do salário: o cálculo de INSS e IRRF é feito sobre o valor integral do 13º.',
    },
    {
      question: 'Comissões e horas extras entram no cálculo do 13º?',
      answer: 'Sim, se forem habituais: a média dessas variáveis pode ser somada ao salário base antes de calcular o 13º.',
    },
  ],
  'calculadora-hora-extra': (r) => [
    {
      question: 'Como é calculado o valor-hora?',
      answer: `O salário é dividido pela jornada mensal, normalmente ${r.overtime.defaultMonthlyHours} horas, podendo variar conforme o contrato.`,
    },
    {
      question: 'Qual a diferença entre hora extra de 50% e de 100%?',
      answer: 'O percentual de 50% costuma valer para horas extras em dias normais, e 100% para domingos e feriados — mas pode variar por convenção coletiva.',
    },
    {
      question: 'O que é o DSR sobre horas extras?',
      answer: 'É o reflexo das horas extras sobre o descanso semanal remunerado: proporcional ao total de horas extras dividido pelos dias úteis, multiplicado pelos domingos e feriados do mês.',
    },
    {
      question: 'Adicionais como insalubridade entram no valor-hora?',
      answer: 'Sim, quando são habituais — informe-os como "adicionais habituais" para que entrem na base do cálculo.',
    },
  ],
  'calculadora-fgts': (r) => [
    {
      question: 'Qual a alíquota do depósito mensal do FGTS?',
      answer: `${formatPercent(r.fgts.monthlyRate, 0)} do salário bruto, depositado pela empresa em conta vinculada ao trabalhador (${formatPercent(r.fgts.apprenticeRate, 0)} para aprendizes).`,
    },
    {
      question: 'Quando tenho direito a sacar o FGTS integral?',
      answer: 'Na dispensa sem justa causa, você pode sacar 100% do saldo, além de receber a multa rescisória sobre ele.',
    },
    {
      question: 'A multa do FGTS estimada aqui é o valor exato?',
      answer: 'Não necessariamente — é uma estimativa. Para o valor exato, informe o saldo real do seu extrato do FGTS (consulte no app FGTS ou no Meu INSS/Caixa).',
    },
  ],
  'calculadora-aviso-previo': (r) => [
    {
      question: 'Quantos dias de aviso prévio eu tenho direito?',
      answer: `${r.notice.baseDays} dias, mais ${r.notice.daysPerYear} dias por ano completo de serviço, até o máximo de ${r.notice.maxDays} dias.`,
    },
    {
      question: 'O pedido de demissão também tem acréscimo de dias?',
      answer: `Não. No pedido de demissão o aviso é sempre de ${r.notice.employeeResignationDays} dias, independentemente do tempo de casa.`,
    },
    {
      question: 'O aviso prévio indenizado conta para o 13º e as férias?',
      answer: 'Sim — ele projeta o tempo de serviço, contando para os avos de 13º e de férias proporcionais.',
    },
    {
      question: 'O que acontece se eu não cumprir o aviso ao pedir demissão?',
      answer: 'A empresa pode descontar do seu acerto rescisório o equivalente aos dias de aviso não cumpridos, até o limite de 30 dias de salário.',
    },
  ],
  'calculadora-inss': (r) => [
    {
      question: 'Como funciona o cálculo progressivo do INSS?',
      answer: 'Cada faixa salarial paga sua própria alíquota, aplicada só sobre a parte do salário que está dentro dela — como no Imposto de Renda.',
    },
    {
      question: 'Existe um teto para o desconto de INSS?',
      answer: `Sim. O salário de contribuição é limitado a ${formatCurrency(r.inss.ceiling)} — quem ganha mais que isso não paga INSS sobre o excedente.`,
    },
    {
      question: 'Qual a diferença entre alíquota nominal e efetiva?',
      answer: 'A alíquota nominal é a da última faixa alcançada pelo salário. A efetiva é o desconto total dividido pelo salário — sempre menor que a nominal, pois as faixas anteriores pagam menos.',
    },
  ],
  'calculadora-irrf': (r) => [
    {
      question: 'Quem está isento de Imposto de Renda em 2026?',
      answer: `Quem tem rendimento tributável mensal até ${formatCurrency(r.irrf.reducer.fullExemptionUpTo)}, pela redução da reforma vigente a partir de 2026.`,
    },
    {
      question: 'Como funciona a dedução por dependente?',
      answer: `Cada dependente reduz a base de cálculo do IRRF em ${formatCurrency(r.irrf.dependentDeduction)}.`,
    },
    {
      question: 'Vale mais usar as deduções legais ou o desconto simplificado?',
      answer: `Depende do seu caso: o desconto simplificado de ${formatCurrency(r.irrf.simplifiedDiscount)} costuma valer mais para quem tem poucos dependentes ou deduções — a calculadora escolhe automaticamente a opção mais vantajosa.`,
    },
  ],
  'calculadora-adicional-noturno': (r) => [
    {
      question: 'O que é a hora noturna reduzida?',
      answer: `Cada hora trabalhada no período noturno equivale a ${r.nightShift.reducedHourMinutes} minutos, então o trabalhador recebe por mais horas do que realmente trabalhou.`,
    },
    {
      question: 'Qual o percentual do adicional noturno?',
      answer: `Pela CLT, ${formatPercent(r.nightShift.additionalRate, 0)} sobre a hora normal, mas pode ser maior por convenção ou acordo coletivo da categoria.`,
    },
    {
      question: 'Qual o horário considerado noturno?',
      answer: 'Para trabalhadores urbanos, das 22h de um dia às 5h do dia seguinte (CLT art. 73).',
    },
  ],
  'calculadora-insalubridade': (r) => [
    {
      question: 'Sobre qual valor incide o adicional de insalubridade?',
      answer: 'Pela regra geral (Súmula Vinculante 4 do STF), sobre o salário mínimo — mas lei ou norma coletiva podem fixar uma base diferente, como o salário base.',
    },
    {
      question: 'Quais são os graus de insalubridade?',
      answer: `Mínimo (${formatPercent(r.unhealthiness.rates.low, 0)}), médio (${formatPercent(r.unhealthiness.rates.medium, 0)}) e máximo (${formatPercent(r.unhealthiness.rates.high, 0)}), conforme laudo técnico das condições de trabalho.`,
    },
    {
      question: 'Posso receber insalubridade e periculosidade ao mesmo tempo?',
      answer: 'Não. Os dois adicionais não são cumuláveis — o trabalhador escolhe o mais vantajoso.',
    },
  ],
  'calculadora-periculosidade': (r) => [
    {
      question: 'Qual o percentual do adicional de periculosidade?',
      answer: `${formatPercent(r.hazardPay.rate, 0)} sobre o salário base, sem incluir gratificações, prêmios ou outras verbas.`,
    },
    {
      question: 'Insalubridade e periculosidade se somam?',
      answer: 'Não — o trabalhador que tem direito aos dois escolhe apenas um, o mais vantajoso.',
    },
  ],
  'calculadora-dsr': () => [
    {
      question: 'O que é o DSR?',
      answer: 'Descanso Semanal Remunerado: o reflexo de verbas variáveis (comissões, horas extras) sobre os dias de descanso, para que o trabalhador não perca renda nesses dias.',
    },
    {
      question: 'O DSR é calculado sobre o salário fixo também?',
      answer: 'Não — o salário fixo mensal já inclui o descanso semanal. O DSR calculado aqui é só sobre a parte variável da remuneração.',
    },
  ],
  'calculadora-banco-de-horas': () => [
    {
      question: 'O banco de horas sempre precisa ser pago em dinheiro?',
      answer: 'Não. A ideia do banco de horas é compensar o saldo com folgas. Só vira pagamento quando não é mais possível compensar (por exemplo, no fim do contrato).',
    },
    {
      question: 'Qual percentual é pago sobre o saldo positivo?',
      answer: 'Normalmente o mesmo da hora extra comum (50%), salvo acordo diferente.',
    },
  ],
  'calculadora-salario-proporcional': () => [
    {
      question: 'Quando o salário é pago de forma proporcional?',
      answer: 'Quando o mês de trabalho é incompleto — por exemplo, admissão ou desligamento no meio do mês.',
    },
    {
      question: 'O salário proporcional tem desconto de INSS e IRRF?',
      answer: 'Sim, os mesmos descontos do salário normal incidem sobre o valor proporcional.',
    },
  ],
  'calculadora-salario-maternidade': () => [
    {
      question: 'Por quantos dias o salário-maternidade é pago?',
      answer: 'Normalmente 120 dias, podendo chegar a 180 dias em empresas participantes do Programa Empresa Cidadã.',
    },
    {
      question: 'O valor é igual para todas as categorias de trabalhadora?',
      answer: 'Não. Empregada CLT recebe a remuneração integral; outras categorias (doméstica, autônoma, MEI, segurada especial) têm regras de cálculo próprias.',
    },
    {
      question: 'Tem desconto de INSS e Imposto de Renda no salário-maternidade?',
      answer:
        'Hoje, sim: a folha desconta o INSS da empregada e o IRRF, que não está entre as isenções do Imposto de Renda. O STF já afastou a contribuição paga pela empresa (Tema 72), e a cobrança sobre a parte da empregada ainda está em julgamento (Tema 1274).',
    },
  ],
  'calculadora-seguro-desemprego': (r) => [
    {
      question: 'Como é calculado o valor da parcela?',
      answer: `Com base na média dos últimos 3 salários: até ${formatCurrency(r.unemploymentInsurance.tier1UpTo)} paga ${formatPercent(r.unemploymentInsurance.tier1Rate, 0)} da média; acima disso, um valor fixo mais um percentual sobre o excedente, até o teto de ${formatCurrency(r.unemploymentInsurance.ceiling)}.`,
    },
    {
      question: 'Quantas parcelas eu tenho direito?',
      answer: 'Depende de quantas vezes você já solicitou o benefício e de quanto tempo trabalhou no período exigido — de 3 a 5 parcelas.',
    },
    {
      question: 'A parcela pode ser menor que o salário mínimo?',
      answer: 'Não. Nenhuma parcela do seguro-desemprego é paga abaixo do salário mínimo vigente.',
    },
  ],
};
