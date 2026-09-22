import type { Metadata } from 'next';
import { ThirteenthCalculator } from '@/components/calculators/ThirteenthCalculator';
import { WorkedExamples } from '@/components/shared/WorkedExamples';
import { Faq } from '@/components/shared/Faq';
import { getFaqFor } from '@/content/faq';
import { calculateThirteenth } from '@/engine/thirteenth';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';

export const metadata: Metadata = {
  title: 'Calculadora de 13º Salário',
  description:
    'Calcule a 1ª e a 2ª parcela do seu 13º salário, com o desconto de INSS e IRRF sobre o valor integral.',
};

export default function ThirteenthPage() {
  const rules = getRulesFor(new Date());
  const examples = [
    { title: '12 meses trabalhados, R$ 3.000', result: calculateThirteenth({ grossSalary: toCents(3000), monthsWorked: 12, dependents: 0 }, rules) },
    { title: '7 meses trabalhados, R$ 4.000', result: calculateThirteenth({ grossSalary: toCents(4000), monthsWorked: 7, dependents: 1 }, rules) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Calculadora de 13º Salário</h1>
      <p className="mt-2 text-gray-600">
        Informe o salário bruto e os meses trabalhados no ano para ver o valor da 1ª e da 2ª
        parcela do 13º.
      </p>
      <div className="mt-6">
        <ThirteenthCalculator />
      </div>
      <WorkedExamples examples={examples} />
      <Faq items={getFaqFor('calculadora-13-salario', rules)} />
    </div>
  );
}
