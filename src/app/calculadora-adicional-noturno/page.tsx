import type { Metadata } from 'next';
import { NightShiftCalculator } from '@/components/calculators/NightShiftCalculator';
import { WorkedExamples } from '@/components/shared/WorkedExamples';
import { Faq } from '@/components/shared/Faq';
import { getFaqFor } from '@/content/faq';
import { calculateNightShift } from '@/engine/nightShift';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';

export const metadata: Metadata = {
  title: 'Calculadora de Adicional Noturno',
  description: 'Calcule o adicional noturno com a hora reduzida (52min30s), conforme a CLT.',
};

export default function NightShiftPage() {
  const rules = getRulesFor(new Date());
  const examples = [
    { title: '30h noturnas, salário R$ 2.200', result: calculateNightShift({ grossSalary: toCents(2200), monthlyHours: 220, nightHoursWorked: 30 }, rules) },
    { title: '60h noturnas, salário R$ 3.000', result: calculateNightShift({ grossSalary: toCents(3000), monthlyHours: 220, nightHoursWorked: 60 }, rules) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Calculadora de Adicional Noturno</h1>
      <p className="mt-2 text-gray-600">
        Informe as horas trabalhadas entre 22h e 5h para ver o valor com a hora noturna reduzida e
        o adicional de 20%.
      </p>
      <div className="mt-6">
        <NightShiftCalculator />
      </div>
      <WorkedExamples examples={examples} />
      <Faq items={getFaqFor('calculadora-adicional-noturno', rules)} />
    </div>
  );
}
