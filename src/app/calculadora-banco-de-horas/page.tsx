import type { Metadata } from 'next';
import { CompTimeCalculator } from '@/components/calculators/CompTimeCalculator';
import { WorkedExamples } from '@/components/shared/WorkedExamples';
import { Faq } from '@/components/shared/Faq';
import { getFaqFor } from '@/content/faq';
import { calculateCompTime } from '@/engine/compTime';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';

export const metadata: Metadata = {
  title: 'Calculadora de Banco de Horas',
  description: 'Calcule o valor do seu saldo de banco de horas, se ele tiver de ser pago como hora extra.',
};

export default function CompTimePage() {
  const rules = getRulesFor(new Date());
  const examples = [
    { title: 'Saldo de +10h, salário R$ 2.200', result: calculateCompTime({ grossSalary: toCents(2200), monthlyHours: 220, balanceHours: 10 }, rules) },
    { title: 'Saldo de +20h, salário R$ 3.000', result: calculateCompTime({ grossSalary: toCents(3000), monthlyHours: 220, balanceHours: 20 }, rules) },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Calculadora de Banco de Horas</h1>
      <p className="mt-3 max-w-3xl text-base text-gray-600 sm:text-lg">
        Informe seu saldo de horas para ver quanto valeria se fosse pago em dinheiro, como hora
        extra.
      </p>
      <div className="mt-8">
        <CompTimeCalculator />
      </div>
      <WorkedExamples examples={examples} />
      <Faq items={getFaqFor('calculadora-banco-de-horas', rules)} />
    </div>
  );
}
