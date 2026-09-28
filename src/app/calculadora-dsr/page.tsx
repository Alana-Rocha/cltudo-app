import type { Metadata } from 'next';
import { DsrCalculator } from '@/components/calculators/DsrCalculator';
import { WorkedExamples } from '@/components/shared/WorkedExamples';
import { Faq } from '@/components/shared/Faq';
import { getFaqFor } from '@/content/faq';
import { calculateDsr } from '@/engine/dsr';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';

export const metadata: Metadata = {
  title: 'Calculadora de DSR',
  description: 'Calcule o DSR (Descanso Semanal Remunerado) sobre comissões e outras verbas variáveis.',
};

export default function DsrPage() {
  const rules = getRulesFor(new Date());
  const examples = [
    { title: 'R$ 1.000 em comissões no mês', result: calculateDsr({ variableAmount: toCents(1000), workingDaysInMonth: 22, sundaysAndHolidaysInMonth: 4 }, rules) },
    { title: 'R$ 2.500 em comissões no mês', result: calculateDsr({ variableAmount: toCents(2500), workingDaysInMonth: 22, sundaysAndHolidaysInMonth: 5 }, rules) },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Calculadora de DSR</h1>
      <p className="mt-3 max-w-3xl text-base text-gray-600 sm:text-lg">
        Informe a remuneração variável do mês (comissões, por exemplo) para ver o valor do DSR
        sobre ela.
      </p>
      <div className="mt-8">
        <DsrCalculator />
      </div>
      <WorkedExamples examples={examples} />
      <Faq items={getFaqFor('calculadora-dsr', rules)} />
    </div>
  );
}
