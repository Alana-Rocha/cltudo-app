import type { Metadata } from 'next';
import { FgtsCalculator } from '@/components/calculators/FgtsCalculator';
import { WorkedExamples } from '@/components/shared/WorkedExamples';
import { Faq } from '@/components/shared/Faq';
import { getFaqFor } from '@/content/faq';
import { calculateFgtsStandalone } from '@/engine/fgts';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';

export const metadata: Metadata = {
  title: 'Calculadora de FGTS',
  description: 'Calcule o depósito mensal do FGTS e, opcionalmente, estime a multa rescisória.',
};

export default function FgtsPage() {
  const rules = getRulesFor(new Date());
  const examples = [
    { title: 'Salário de R$ 2.500 — depósito mensal', result: calculateFgtsStandalone({ grossSalary: toCents(2500) }, rules) },
    {
      title: 'Salário R$ 2.500, dispensa sem justa causa, 24 meses',
      result: calculateFgtsStandalone(
        {
          grossSalary: toCents(2500),
          rescission: { terminationType: 'without_cause', monthsEmployed: 24, thirteenthAmount: toCents(2500), vacationTakenAmount: 0, noticeIndemnifiedAmount: toCents(2500), balanceAmount: 0 },
        },
        rules
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Calculadora de FGTS</h1>
      <p className="mt-3 max-w-3xl text-base text-gray-600 sm:text-lg">
        Veja o valor do depósito mensal do FGTS e, se estiver saindo do emprego, uma estimativa da
        multa rescisória.
      </p>
      <div className="mt-8">
        <FgtsCalculator />
      </div>
      <WorkedExamples examples={examples} />
      <Faq items={getFaqFor('calculadora-fgts', rules)} />
    </div>
  );
}
