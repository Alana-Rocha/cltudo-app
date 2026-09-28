import type { Metadata } from 'next';
import { RaiseCalculator } from '@/components/calculators/RaiseCalculator';
import { WorkedExamples } from '@/components/shared/WorkedExamples';
import { Faq } from '@/components/shared/Faq';
import { getFaqFor } from '@/content/faq';
import { calculateRaise } from '@/engine/raise';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';

export const metadata: Metadata = {
  title: 'Simulador de Aumento Salarial',
  description:
    'Descubra quanto um aumento no salário bruto vira de fato no líquido, depois do INSS e do Imposto de Renda.',
};

export default function RaisePage() {
  const rules = getRulesFor(new Date());
  const examples = [
    {
      title: 'De R$ 3.000 para R$ 3.300 (10%)',
      result: calculateRaise({ currentGross: toCents(3000), newGross: toCents(3300), dependents: 0 }, rules),
    },
    {
      title: 'De R$ 5.500 para R$ 6.050 (10%)',
      result: calculateRaise({ currentGross: toCents(5500), newGross: toCents(6050), dependents: 0 }, rules),
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Simulador de Aumento Salarial</h1>
      <p className="mt-3 max-w-3xl text-base text-gray-600 sm:text-lg">
        Informe o salário atual e o aumento para ver quanto dele chega de fato ao seu bolso, depois
        do INSS e do Imposto de Renda.
      </p>
      <div className="mt-8">
        <RaiseCalculator />
      </div>
      <WorkedExamples examples={examples} />
      <Faq items={getFaqFor('calculadora-aumento-salarial', rules)} />
    </div>
  );
}
