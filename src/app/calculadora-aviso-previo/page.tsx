import type { Metadata } from 'next';
import { NoticeCalculator } from '@/components/calculators/NoticeCalculator';
import { WorkedExamples } from '@/components/shared/WorkedExamples';
import { Faq } from '@/components/shared/Faq';
import { getFaqFor } from '@/content/faq';
import { calculateNoticeStandalone } from '@/engine/notice';
import { getRulesFor } from '@/rules';

export const metadata: Metadata = {
  title: 'Calculadora de Aviso Prévio',
  description: 'Calcule os dias de aviso prévio proporcional ao tempo de serviço (Lei 12.506/2011).',
};

export default function NoticePage() {
  const reference = new Date(Date.UTC(2026, 5, 1));
  const rules = getRulesFor(reference);
  const examples = [
    { title: 'Dispensa sem justa causa, 5 anos de casa', result: calculateNoticeStandalone(new Date(Date.UTC(2021, 5, 1)), reference, 'without_cause', rules) },
    { title: 'Pedido de demissão, 5 anos de casa', result: calculateNoticeStandalone(new Date(Date.UTC(2021, 5, 1)), reference, 'employee_resignation', rules) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Calculadora de Aviso Prévio</h1>
      <p className="mt-2 text-gray-600">
        Informe as datas de admissão e desligamento para saber quantos dias de aviso prévio são
        devidos.
      </p>
      <div className="mt-6">
        <NoticeCalculator />
      </div>
      <WorkedExamples examples={examples} />
      <Faq items={getFaqFor('calculadora-aviso-previo', rules)} />
    </div>
  );
}
