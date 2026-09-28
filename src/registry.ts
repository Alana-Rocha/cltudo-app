export type CalculatorStatus = 'available' | 'coming_soon';

export type CalculatorCategory = 'salary' | 'benefits' | 'termination' | 'workday' | 'employer';

export const categories: { id: CalculatorCategory; title: string }[] = [
  { id: 'salary', title: 'Salário e descontos' },
  { id: 'termination', title: 'Desligamento' },
  { id: 'benefits', title: 'Férias, 13º e benefícios' },
  { id: 'workday', title: 'Jornada e adicionais' },
  { id: 'employer', title: 'Para empresas' },
];

export type CalculatorEntry = {
  slug: string;
  title: string;
  shortDescription: string;
  icon: string; // lucide-react icon name, resolved by the UI layer
  status: CalculatorStatus;
  category: CalculatorCategory;
  related: string[]; // slugs
};

export const registry: CalculatorEntry[] = [
  { slug: 'calculadora-salario-liquido', category: 'salary', title: 'Salário líquido', shortDescription: 'Quanto sobra do seu salário depois de INSS e IRRF.', icon: 'wallet', status: 'available', related: ['calculadora-aumento-salarial', 'calculadora-inss', 'calculadora-irrf', 'calculadora-13-salario'] },
  { slug: 'calculadora-aumento-salarial', category: 'salary', title: 'Simulador de aumento', shortDescription: 'Quanto um aumento no bruto vira de fato no líquido.', icon: 'trending-up', status: 'available', related: ['calculadora-salario-liquido', 'calculadora-irrf', 'calculadora-inss'] },
  { slug: 'calculadora-clt-x-pj', category: 'salary', title: 'CLT x PJ', shortDescription: 'Compare uma proposta CLT com uma PJ no Simples Nacional.', icon: 'scale', status: 'available', related: ['calculadora-salario-liquido', 'calculadora-custo-funcionario', 'calculadora-fgts'] },
  { slug: 'calculadora-rescisao', category: 'termination', title: 'Rescisão', shortDescription: 'Quanto você recebe ao sair do emprego, por tipo de desligamento.', icon: 'file-text', status: 'available', related: ['calculadora-aviso-previo', 'calculadora-fgts', 'calculadora-seguro-desemprego', 'calculadora-ferias'] },
  { slug: 'calculadora-ferias', category: 'benefits', title: 'Férias', shortDescription: 'Valor das férias, 1/3 constitucional e abono pecuniário.', icon: 'palm-tree', status: 'available', related: ['calculadora-13-salario', 'calculadora-salario-liquido', 'calculadora-rescisao'] },
  { slug: 'calculadora-13-salario', category: 'benefits', title: '13º salário', shortDescription: '1ª e 2ª parcelas do 13º, com INSS e IRRF.', icon: 'gift', status: 'available', related: ['calculadora-ferias', 'calculadora-salario-liquido', 'calculadora-rescisao'] },
  { slug: 'calculadora-hora-extra', category: 'workday', title: 'Hora extra', shortDescription: 'Valor das horas extras e o DSR sobre elas.', icon: 'clock', status: 'available', related: ['calculadora-dsr', 'calculadora-banco-de-horas', 'calculadora-adicional-noturno'] },
  { slug: 'calculadora-fgts', category: 'termination', title: 'FGTS', shortDescription: 'Depósitos mensais e multa rescisória do FGTS.', icon: 'piggy-bank', status: 'available', related: ['calculadora-rescisao', 'calculadora-seguro-desemprego', 'calculadora-aviso-previo'] },
  { slug: 'calculadora-aviso-previo', category: 'termination', title: 'Aviso prévio', shortDescription: 'Dias de aviso prévio e projeção do contrato.', icon: 'calendar-clock', status: 'available', related: ['calculadora-rescisao', 'calculadora-fgts', 'calculadora-seguro-desemprego'] },
  { slug: 'calculadora-inss', category: 'salary', title: 'INSS', shortDescription: 'Desconto de INSS por faixa, com alíquota efetiva.', icon: 'landmark', status: 'available', related: ['calculadora-irrf', 'calculadora-salario-liquido'] },
  { slug: 'calculadora-irrf', category: 'salary', title: 'IRRF', shortDescription: 'Imposto de renda retido na fonte sobre o salário.', icon: 'receipt', status: 'available', related: ['calculadora-inss', 'calculadora-salario-liquido'] },
  { slug: 'calculadora-adicional-noturno', category: 'workday', title: 'Adicional noturno', shortDescription: 'Valor do trabalho noturno, com a hora reduzida.', icon: 'moon', status: 'available', related: ['calculadora-hora-extra', 'calculadora-dsr'] },
  { slug: 'calculadora-insalubridade', category: 'workday', title: 'Insalubridade', shortDescription: 'Adicional de insalubridade nos graus mínimo, médio e máximo.', icon: 'shield-alert', status: 'available', related: ['calculadora-periculosidade', 'calculadora-salario-liquido'] },
  { slug: 'calculadora-periculosidade', category: 'workday', title: 'Periculosidade', shortDescription: 'Adicional de periculosidade de 30% sobre o salário base.', icon: 'triangle-alert', status: 'available', related: ['calculadora-insalubridade', 'calculadora-salario-liquido'] },
  { slug: 'calculadora-dsr', category: 'workday', title: 'DSR', shortDescription: 'Descanso semanal remunerado sobre comissões e variáveis.', icon: 'calendar-days', status: 'available', related: ['calculadora-hora-extra', 'calculadora-adicional-noturno'] },
  { slug: 'calculadora-banco-de-horas', category: 'workday', title: 'Banco de horas', shortDescription: 'Valor do saldo de horas se pago como hora extra.', icon: 'timer', status: 'available', related: ['calculadora-hora-extra', 'calculadora-dsr'] },
  { slug: 'calculadora-salario-proporcional', category: 'salary', title: 'Salário proporcional', shortDescription: 'Salário de um mês incompleto de trabalho.', icon: 'calendar-range', status: 'available', related: ['calculadora-salario-liquido', 'calculadora-rescisao'] },
  { slug: 'calculadora-salario-maternidade', category: 'benefits', title: 'Salário-maternidade', shortDescription: 'Valor do benefício para empregada CLT, 120 ou 180 dias.', icon: 'baby', status: 'available', related: ['calculadora-salario-liquido', 'calculadora-ferias'] },
  { slug: 'calculadora-seguro-desemprego', category: 'termination', title: 'Seguro-desemprego', shortDescription: 'Valor e número de parcelas do seguro-desemprego.', icon: 'umbrella', status: 'available', related: ['calculadora-rescisao', 'calculadora-fgts'] },
  { slug: 'calculadora-custo-funcionario', category: 'employer', title: 'Custo do funcionário', shortDescription: 'Quanto um funcionário CLT custa para a empresa, com todos os encargos.', icon: 'building', status: 'available', related: ['calculadora-clt-x-pj', 'calculadora-salario-liquido', 'calculadora-fgts'] },
];
