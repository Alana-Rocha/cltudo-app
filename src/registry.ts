export type CalculatorStatus = 'available' | 'coming_soon';

export type CalculatorEntry = {
  slug: string;
  title: string;
  shortDescription: string;
  icon: string; // lucide-react icon name, resolved by the UI layer
  status: CalculatorStatus;
};

export const registry: CalculatorEntry[] = [
  { slug: 'calculadora-salario-liquido', title: 'Salário líquido', shortDescription: 'Quanto sobra do seu salário depois de INSS e IRRF.', icon: 'wallet', status: 'available' },
  { slug: 'calculadora-rescisao', title: 'Rescisão', shortDescription: 'Quanto você recebe ao sair do emprego, por tipo de desligamento.', icon: 'file-text', status: 'available' },
  { slug: 'calculadora-ferias', title: 'Férias', shortDescription: 'Valor das férias, 1/3 constitucional e abono pecuniário.', icon: 'palm-tree', status: 'available' },
  { slug: 'calculadora-13-salario', title: '13º salário', shortDescription: '1ª e 2ª parcelas do 13º, com INSS e IRRF.', icon: 'gift', status: 'available' },
  { slug: 'calculadora-hora-extra', title: 'Hora extra', shortDescription: 'Valor das horas extras e o DSR sobre elas.', icon: 'clock', status: 'available' },
  { slug: 'calculadora-fgts', title: 'FGTS', shortDescription: 'Depósitos mensais e multa rescisória do FGTS.', icon: 'piggy-bank', status: 'available' },
  { slug: 'calculadora-aviso-previo', title: 'Aviso prévio', shortDescription: 'Dias de aviso prévio e projeção do contrato.', icon: 'calendar-clock', status: 'available' },
  { slug: 'calculadora-inss', title: 'INSS', shortDescription: 'Desconto de INSS por faixa, com alíquota efetiva.', icon: 'landmark', status: 'available' },
  { slug: 'calculadora-irrf', title: 'IRRF', shortDescription: 'Imposto de renda retido na fonte sobre o salário.', icon: 'receipt', status: 'available' },
  { slug: 'calculadora-adicional-noturno', title: 'Adicional noturno', shortDescription: 'Valor do trabalho noturno, com a hora reduzida.', icon: 'moon', status: 'available' },
  { slug: 'calculadora-insalubridade', title: 'Insalubridade', shortDescription: 'Adicional de insalubridade nos graus mínimo, médio e máximo.', icon: 'shield-alert', status: 'available' },
  { slug: 'calculadora-periculosidade', title: 'Periculosidade', shortDescription: 'Adicional de periculosidade de 30% sobre o salário base.', icon: 'triangle-alert', status: 'available' },
  { slug: 'calculadora-dsr', title: 'DSR', shortDescription: 'Descanso semanal remunerado sobre comissões e variáveis.', icon: 'calendar-days', status: 'available' },
  { slug: 'calculadora-banco-de-horas', title: 'Banco de horas', shortDescription: 'Valor do saldo de horas se pago como hora extra.', icon: 'timer', status: 'available' },
  { slug: 'calculadora-salario-proporcional', title: 'Salário proporcional', shortDescription: 'Salário de um mês incompleto de trabalho.', icon: 'calendar-range', status: 'available' },
  { slug: 'calculadora-salario-maternidade', title: 'Salário-maternidade', shortDescription: 'Valor do benefício para empregada CLT, 120 ou 180 dias.', icon: 'baby', status: 'available' },
  { slug: 'calculadora-seguro-desemprego', title: 'Seguro-desemprego', shortDescription: 'Valor e número de parcelas do seguro-desemprego.', icon: 'umbrella', status: 'available' },
];
