import type { Metadata } from 'next';
import { CltVsPjCalculator } from '@/components/calculators/CltVsPjCalculator';
import { WorkedExamples } from '@/components/shared/WorkedExamples';
import { Faq } from '@/components/shared/Faq';
import { getFaqFor } from '@/content/faq';
import { calculateCltVsPj } from '@/engine/cltVsPj';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';

export const metadata: Metadata = {
  title: 'Calculadora CLT x PJ',
  description:
    'Compare uma proposta CLT com uma PJ: salário, férias, 13º e FGTS contra faturamento, Simples Nacional, pró-labore e impostos.',
};

export default function CltVsPjPage() {
  const rules = getRulesFor(new Date());
  const example = (title: string, revenue: number) => {
    const result = calculateCltVsPj(
      { cltGross: toCents(8000), dependents: 0, pjMonthlyRevenue: toCents(revenue), pjMonthlyCosts: toCents(300) },
      rules
    );
    const diff = result.totals.net;
    return { title, result, highlight: { value: Math.abs(diff), caption: `a mais como ${diff > 0 ? 'PJ' : 'CLT'}, por ano` } };
  };
  const examples = [example('CLT de R$ 8.000 ou PJ de R$ 10.000', 10000), example('CLT de R$ 8.000 ou PJ de R$ 12.000', 12000)];

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Calculadora CLT x PJ</h1>
      <p className="mt-3 max-w-3xl text-base text-gray-600 sm:text-lg">
        Compare as duas propostas no ano inteiro: de um lado salário, férias, 13º, FGTS e benefícios;
        do outro, o faturamento como PJ no Simples Nacional, menos impostos, pró-labore e custos.
      </p>
      <div className="mt-8">
        <CltVsPjCalculator />
      </div>
      <WorkedExamples examples={examples} />
      <Faq items={getFaqFor('calculadora-clt-x-pj', rules)} />
    </div>
  );
}
