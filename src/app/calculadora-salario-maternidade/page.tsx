import type { Metadata } from 'next';
import { MaternityLeaveCalculator } from '@/components/calculators/MaternityLeaveCalculator';
import { WorkedExamples } from '@/components/shared/WorkedExamples';
import { Faq } from '@/components/shared/Faq';
import { getFaqFor } from '@/content/faq';
import { calculateMaternityLeave } from '@/engine/maternityLeave';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';

export const metadata: Metadata = {
  title: 'Calculadora de Salário-Maternidade',
  description: 'Calcule o valor do salário-maternidade para empregada CLT, por 120 ou 180 dias.',
};

export default function MaternityLeavePage() {
  const rules = getRulesFor(new Date());
  const examples = [
    { title: 'Remuneração de R$ 3.000, 120 dias', result: calculateMaternityLeave({ monthlyAmount: toCents(3000) }, rules) },
    { title: 'Remuneração de R$ 3.000, Empresa Cidadã (180 dias)', result: calculateMaternityLeave({ monthlyAmount: toCents(3000), extendedProgram: true }, rules) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Calculadora de Salário-Maternidade</h1>
      <p className="mt-2 text-gray-600">
        Para empregadas CLT: informe a remuneração mensal integral para ver o valor líquido do
        benefício, com os descontos de INSS e IRRF mês a mês.
      </p>
      <div className="mt-6">
        <MaternityLeaveCalculator />
      </div>
      <WorkedExamples examples={examples} />
      <Faq items={getFaqFor('calculadora-salario-maternidade', rules)} />
    </div>
  );
}
