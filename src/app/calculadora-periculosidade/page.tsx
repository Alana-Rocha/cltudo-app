import type { Metadata } from 'next';
import { HazardPayCalculator } from '@/components/calculators/HazardPayCalculator';
import { WorkedExamples } from '@/components/shared/WorkedExamples';
import { Faq } from '@/components/shared/Faq';
import { getFaqFor } from '@/content/faq';
import { calculateHazardPay } from '@/engine/hazardPay';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';

export const metadata: Metadata = {
  title: 'Calculadora de Periculosidade',
  description: 'Calcule o adicional de periculosidade: 30% sobre o salário base, conforme a CLT.',
};

export default function HazardPayPage() {
  const rules = getRulesFor(new Date());
  const examples = [
    { title: 'Salário base de R$ 2.000', result: calculateHazardPay({ baseSalary: toCents(2000) }, rules) },
    { title: 'Salário base de R$ 3.500', result: calculateHazardPay({ baseSalary: toCents(3500) }, rules) },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Calculadora de Periculosidade</h1>
      <p className="mt-3 max-w-3xl text-base text-gray-600 sm:text-lg">
        Informe o salário base (sem gratificações) para ver o valor do adicional de
        periculosidade.
      </p>
      <div className="mt-8">
        <HazardPayCalculator />
      </div>
      <WorkedExamples examples={examples} />
      <Faq items={getFaqFor('calculadora-periculosidade', rules)} />
    </div>
  );
}
