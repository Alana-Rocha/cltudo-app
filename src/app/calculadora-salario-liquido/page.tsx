import type { Metadata } from 'next';
import { SalaryCalculator } from '@/components/calculators/SalaryCalculator';
import { WorkedExamples } from '@/components/shared/WorkedExamples';
import { Faq } from '@/components/shared/Faq';
import { getFaqFor } from '@/content/faq';
import { calculateSalary } from '@/engine/salary';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';

export const metadata: Metadata = {
  title: 'Calculadora de Salário Líquido',
  description:
    'Calcule quanto você recebe de salário líquido depois dos descontos de INSS e IRRF, com o passo a passo do cálculo.',
};

export default function SalaryPage() {
  const rules = getRulesFor(new Date());
  const examples = [
    { title: 'Salário de R$ 2.000, sem dependentes', result: calculateSalary({ grossSalary: toCents(2000), dependents: 0 }, rules) },
    { title: 'Salário de R$ 6.000, 2 dependentes', result: calculateSalary({ grossSalary: toCents(6000), dependents: 2 }, rules) },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Calculadora de Salário Líquido</h1>
      <p className="mt-3 max-w-3xl text-base text-gray-600 sm:text-lg">
        Informe o salário bruto e o número de dependentes para ver quanto sobra depois do INSS e
        do Imposto de Renda, com cada etapa do cálculo detalhada.
      </p>
      <div className="mt-8">
        <SalaryCalculator />
      </div>
      <WorkedExamples examples={examples} />
      <Faq items={getFaqFor('calculadora-salario-liquido', rules)} />
    </div>
  );
}
