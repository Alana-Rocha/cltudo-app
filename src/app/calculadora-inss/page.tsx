import type { Metadata } from 'next';
import { InssCalculator } from '@/components/calculators/InssCalculator';
import { WorkedExamples } from '@/components/shared/WorkedExamples';
import { Faq } from '@/components/shared/Faq';
import { getFaqFor } from '@/content/faq';
import { calculateInssStandalone } from '@/engine/inss';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';

export const metadata: Metadata = {
  title: 'Calculadora de INSS',
  description: 'Calcule o desconto de INSS por faixa progressiva, com a alíquota efetiva e nominal.',
};

export default function InssPage() {
  const rules = getRulesFor(new Date());
  const examples = [
    { title: 'Salário de R$ 2.000', result: calculateInssStandalone(toCents(2000), rules) },
    { title: 'Salário de R$ 6.000', result: calculateInssStandalone(toCents(6000), rules) },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Calculadora de INSS</h1>
      <p className="mt-3 max-w-3xl text-base text-gray-600 sm:text-lg">
        Informe o salário de contribuição para ver o desconto de INSS calculado faixa por faixa.
      </p>
      <div className="mt-8">
        <InssCalculator />
      </div>
      <WorkedExamples examples={examples} />
      <Faq items={getFaqFor('calculadora-inss', rules)} />
    </div>
  );
}
