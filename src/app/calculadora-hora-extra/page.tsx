import type { Metadata } from 'next';
import { OvertimeCalculator } from '@/components/calculators/OvertimeCalculator';
import { WorkedExamples } from '@/components/shared/WorkedExamples';
import { Faq } from '@/components/shared/Faq';
import { getFaqFor } from '@/content/faq';
import { calculateOvertime } from '@/engine/overtime';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';

export const metadata: Metadata = {
  title: 'Calculadora de Hora Extra',
  description:
    'Calcule o valor das suas horas extras a 50% e 100%, com o DSR (descanso semanal remunerado) sobre elas.',
};

export default function OvertimePage() {
  const rules = getRulesFor(new Date());
  const examples = [
    {
      title: '10h extras a 50%, salário R$ 2.200',
      result: calculateOvertime({ grossSalary: toCents(2200), lines: [{ hours: 10, rate: 0.5 }], workingDaysInMonth: 22, sundaysAndHolidaysInMonth: 4 }, rules),
    },
    {
      title: '5h a 50% + 3h a 100%, salário R$ 3.300',
      result: calculateOvertime({ grossSalary: toCents(3300), lines: [{ hours: 5, rate: 0.5 }, { hours: 3, rate: 1.0 }], workingDaysInMonth: 22, sundaysAndHolidaysInMonth: 4 }, rules),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Calculadora de Hora Extra</h1>
      <p className="mt-2 text-gray-600">
        Informe o salário bruto e as horas extras trabalhadas para ver o valor de cada percentual
        e o DSR sobre elas.
      </p>
      <div className="mt-6">
        <OvertimeCalculator />
      </div>
      <WorkedExamples examples={examples} />
      <Faq items={getFaqFor('calculadora-hora-extra', rules)} />
    </div>
  );
}
