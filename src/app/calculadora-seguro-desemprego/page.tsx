import type { Metadata } from 'next';
import { UnemploymentInsuranceCalculator } from '@/components/calculators/UnemploymentInsuranceCalculator';
import { WorkedExamples } from '@/components/shared/WorkedExamples';
import { Faq } from '@/components/shared/Faq';
import { getFaqFor } from '@/content/faq';
import { calculateUnemploymentInsurance } from '@/engine/unemploymentInsurance';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';

export const metadata: Metadata = {
  title: 'Calculadora de Seguro-Desemprego',
  description: 'Calcule o valor e o número de parcelas do seguro-desemprego, com base nos últimos 3 salários.',
};

export default function UnemploymentInsurancePage() {
  const rules = getRulesFor(new Date());
  const examples = [
    {
      title: 'Média de R$ 1.800, 1ª solicitação, 12 meses',
      result: calculateUnemploymentInsurance({ lastThreeSalaries: [toCents(1800), toCents(1800), toCents(1800)], requestNumber: 1, monthsWorkedInPeriod: 12 }, rules),
    },
    {
      title: 'Média de R$ 3.000, 1ª solicitação, 24 meses',
      result: calculateUnemploymentInsurance({ lastThreeSalaries: [toCents(3000), toCents(3000), toCents(3000)], requestNumber: 1, monthsWorkedInPeriod: 24 }, rules),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Calculadora de Seguro-Desemprego</h1>
      <p className="mt-2 text-gray-600">
        Informe seus últimos 3 salários para ver o valor de cada parcela e quantas parcelas você
        tem direito a receber.
      </p>
      <div className="mt-6">
        <UnemploymentInsuranceCalculator />
      </div>
      <WorkedExamples examples={examples} />
      <Faq items={getFaqFor('calculadora-seguro-desemprego', rules)} />
    </div>
  );
}
