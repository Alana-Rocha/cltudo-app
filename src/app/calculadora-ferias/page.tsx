import type { Metadata } from 'next';
import { VacationCalculator } from '@/components/calculators/VacationCalculator';
import { WorkedExamples } from '@/components/shared/WorkedExamples';
import { Faq } from '@/components/shared/Faq';
import { getFaqFor } from '@/content/faq';
import { calculateVacation } from '@/engine/vacation';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';

export const metadata: Metadata = {
  title: 'Calculadora de Férias',
  description:
    'Calcule o valor das suas férias com o 1/3 constitucional e o abono pecuniário, com INSS e IRRF detalhados.',
};

export default function VacationPage() {
  const rules = getRulesFor(new Date());
  const examples = [
    { title: '30 dias gozados, sem venda, R$ 3.000', result: calculateVacation({ grossSalary: toCents(3000), daysTaken: 30, daysSold: 0, dependents: 0 }, rules) },
    { title: '20 dias gozados + 10 dias vendidos, R$ 3.000', result: calculateVacation({ grossSalary: toCents(3000), daysTaken: 20, daysSold: 10, dependents: 0 }, rules) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Calculadora de Férias</h1>
      <p className="mt-2 text-gray-600">
        Informe o salário bruto, os dias de férias a gozar e, se quiser vender parte delas, o
        abono pecuniário.
      </p>
      <div className="mt-6">
        <VacationCalculator />
      </div>
      <WorkedExamples examples={examples} />
      <Faq items={getFaqFor('calculadora-ferias', rules)} />
    </div>
  );
}
