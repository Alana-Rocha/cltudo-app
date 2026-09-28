import type { Metadata } from 'next';
import { ProportionalSalaryCalculator } from '@/components/calculators/ProportionalSalaryCalculator';
import { WorkedExamples } from '@/components/shared/WorkedExamples';
import { Faq } from '@/components/shared/Faq';
import { getFaqFor } from '@/content/faq';
import { calculateProportionalSalary } from '@/engine/proportionalSalary';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';

export const metadata: Metadata = {
  title: 'Calculadora de Salário Proporcional',
  description: 'Calcule o salário de um mês incompleto de trabalho, por admissão ou saída no meio do mês.',
};

export default function ProportionalSalaryPage() {
  const rules = getRulesFor(new Date());
  const examples = [
    { title: '15 dias trabalhados, salário R$ 3.000', result: calculateProportionalSalary({ grossSalary: toCents(3000), daysWorked: 15, dependents: 0 }, rules) },
    { title: '22 dias trabalhados, salário R$ 4.000', result: calculateProportionalSalary({ grossSalary: toCents(4000), daysWorked: 22, dependents: 0 }, rules) },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Calculadora de Salário Proporcional</h1>
      <p className="mt-3 max-w-3xl text-base text-gray-600 sm:text-lg">
        Informe o salário mensal integral e os dias trabalhados para ver o valor proporcional,
        já com INSS e IRRF.
      </p>
      <div className="mt-8">
        <ProportionalSalaryCalculator />
      </div>
      <WorkedExamples examples={examples} />
      <Faq items={getFaqFor('calculadora-salario-proporcional', rules)} />
    </div>
  );
}
