import type { Metadata } from 'next';
import { TerminationCheckCalculator } from '@/components/calculators/TerminationCheckCalculator';
import { Faq } from '@/components/shared/Faq';
import { getFaqFor } from '@/content/faq';
import { getRulesFor } from '@/rules';

export const metadata: Metadata = {
  title: 'Conferir Rescisão: o que você recebeu está certo?',
  description:
    'Compare o Termo de Rescisão (TRCT) com o que a CLT manda pagar, verba por verba, e veja os prazos de pagamento, seguro-desemprego e a multa por atraso do art. 477.',
};

export default function TerminationCheckPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Conferir rescisão</h1>
      <p className="mt-3 max-w-3xl text-base text-gray-600 sm:text-lg">
        Informe os dados do contrato e copie os valores do seu Termo de Rescisão (TRCT). A conferência mostra,
        verba por verba, se faltou dinheiro, se a empresa pagou no prazo e até quando você pode reclamar.
      </p>
      <p className="mt-2 max-w-3xl text-sm text-gray-500">
        Tudo é calculado no seu navegador: nenhum valor do seu termo é enviado para servidor algum.
      </p>
      <div className="mt-8">
        <TerminationCheckCalculator />
      </div>
      <Faq items={getFaqFor('conferir-rescisao', getRulesFor(new Date()))} />
    </div>
  );
}
