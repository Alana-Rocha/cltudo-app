import type { Metadata } from 'next';
import { TerminationCalculator } from '@/components/calculators/TerminationCalculator';
import { WorkedExamples } from '@/components/shared/WorkedExamples';
import { Faq } from '@/components/shared/Faq';
import { getFaqFor } from '@/content/faq';
import { calculateTermination } from '@/engine/termination';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';

export const metadata: Metadata = {
  title: 'Calculadora de Rescisão Trabalhista',
  description:
    'Calcule os valores da rescisão de contrato de trabalho por tipo de desligamento: sem justa causa, pedido de demissão, justa causa, acordo ou término de contrato.',
};

export default function TerminationPage() {
  const referenceDate = new Date(Date.UTC(2026, 5, 30));
  const rules = getRulesFor(referenceDate);
  const examples = [
    {
      title: 'Sem justa causa, 2 anos de casa, aviso indenizado',
      result: calculateTermination(
        {
          admissionDate: new Date(Date.UTC(2024, 5, 1)),
          terminationDate: referenceDate,
          grossSalary: toCents(3000),
          terminationType: 'without_cause',
          noticeMode: 'indemnified',
          dependents: 0,
          daysWorkedInLastMonth: 30,
        },
        rules
      ),
    },
    {
      title: 'Pedido de demissão, aviso trabalhado',
      result: calculateTermination(
        {
          admissionDate: new Date(Date.UTC(2024, 5, 1)),
          terminationDate: referenceDate,
          grossSalary: toCents(3000),
          terminationType: 'employee_resignation',
          noticeMode: 'worked',
          dependents: 0,
          daysWorkedInLastMonth: 30,
        },
        rules
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Calculadora de Rescisão</h1>
      <p className="mt-3 max-w-3xl text-base text-gray-600 sm:text-lg">
        Informe as datas do contrato, o salário e o tipo de desligamento para ver quais verbas são
        devidas e o valor líquido a receber.
      </p>
      <div className="mt-8">
        <TerminationCalculator />
      </div>
      <WorkedExamples examples={examples} />
      <Faq items={getFaqFor('calculadora-rescisao', rules)} />
    </div>
  );
}
