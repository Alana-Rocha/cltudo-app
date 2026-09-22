import type { Metadata } from 'next';
import { IrrfCalculator } from '@/components/calculators/IrrfCalculator';
import { WorkedExamples } from '@/components/shared/WorkedExamples';
import { Faq } from '@/components/shared/Faq';
import { getFaqFor } from '@/content/faq';
import { calculateIrrfStandalone } from '@/engine/irrf';
import { calculateInss } from '@/engine/inss';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';

export const metadata: Metadata = {
  title: 'Calculadora de IRRF',
  description: 'Calcule o Imposto de Renda Retido na Fonte sobre o salário, com dependentes e pensão alimentícia.',
};

export default function IrrfPage() {
  const rules = getRulesFor(new Date());
  const income1 = toCents(4000);
  const income2 = toCents(9000);
  const examples = [
    { title: 'Rendimento de R$ 4.000, sem dependentes', result: calculateIrrfStandalone({ taxableIncome: income1, inss: calculateInss(income1, rules).total, dependents: 0 }, rules) },
    { title: 'Rendimento de R$ 9.000, 2 dependentes', result: calculateIrrfStandalone({ taxableIncome: income2, inss: calculateInss(income2, rules).total, dependents: 2 }, rules) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Calculadora de IRRF</h1>
      <p className="mt-2 text-gray-600">
        Informe o rendimento tributável e os dependentes para ver o Imposto de Renda Retido na
        Fonte.
      </p>
      <div className="mt-6">
        <IrrfCalculator />
      </div>
      <WorkedExamples examples={examples} />
      <Faq items={getFaqFor('calculadora-irrf', rules)} />
    </div>
  );
}
