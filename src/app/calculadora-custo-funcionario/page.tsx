import type { Metadata } from 'next';
import { EmployerCostCalculator } from '@/components/calculators/EmployerCostCalculator';
import { WorkedExamples } from '@/components/shared/WorkedExamples';
import { Faq } from '@/components/shared/Faq';
import { getFaqFor } from '@/content/faq';
import { calculateEmployerCost } from '@/engine/employerCost';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';

export const metadata: Metadata = {
  title: 'Calculadora de Custo do Funcionário',
  description:
    'Calcule quanto um funcionário CLT custa para a empresa: salário, 13º, férias, FGTS, INSS patronal e demais encargos.',
};

export default function EmployerCostPage() {
  const rules = getRulesFor(new Date());
  const examples = [
    {
      title: 'Salário de R$ 3.000, Simples Nacional',
      result: calculateEmployerCost({ grossSalary: toCents(3000), regime: 'simples', ratRate: 0.02 }, rules),
    },
    {
      title: 'Salário de R$ 3.000, Lucro Presumido (RAT 2%)',
      result: calculateEmployerCost({ grossSalary: toCents(3000), regime: 'standard', ratRate: 0.02 }, rules),
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Calculadora de Custo do Funcionário</h1>
      <p className="mt-3 max-w-3xl text-base text-gray-600 sm:text-lg">
        Informe o salário e o regime tributário da empresa para ver o custo mensal e anual de um
        funcionário CLT, com provisão de 13º e férias e todos os encargos.
      </p>
      <div className="mt-8">
        <EmployerCostCalculator />
      </div>
      <WorkedExamples examples={examples} />
      <Faq items={getFaqFor('calculadora-custo-funcionario', rules)} />
    </div>
  );
}
