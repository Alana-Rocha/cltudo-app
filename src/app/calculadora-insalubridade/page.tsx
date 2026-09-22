import type { Metadata } from 'next';
import { UnhealthinessCalculator } from '@/components/calculators/UnhealthinessCalculator';
import { WorkedExamples } from '@/components/shared/WorkedExamples';
import { Faq } from '@/components/shared/Faq';
import { getFaqFor } from '@/content/faq';
import { calculateUnhealthiness } from '@/engine/unhealthiness';
import { getRulesFor } from '@/rules';

export const metadata: Metadata = {
  title: 'Calculadora de Insalubridade',
  description: 'Calcule o adicional de insalubridade nos graus mínimo (10%), médio (20%) e máximo (40%).',
};

export default function UnhealthinessPage() {
  const rules = getRulesFor(new Date());
  const examples = [
    { title: 'Grau médio (20%), sobre o salário mínimo', result: calculateUnhealthiness({ grade: 'medium' }, rules) },
    { title: 'Grau máximo (40%), sobre o salário mínimo', result: calculateUnhealthiness({ grade: 'high' }, rules) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Calculadora de Insalubridade</h1>
      <p className="mt-2 text-gray-600">
        Escolha o grau de insalubridade para ver o valor do adicional, calculado por padrão sobre
        o salário mínimo.
      </p>
      <div className="mt-6">
        <UnhealthinessCalculator />
      </div>
      <WorkedExamples examples={examples} />
      <Faq items={getFaqFor('calculadora-insalubridade', rules)} />
    </div>
  );
}
