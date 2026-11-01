import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { site } from '@/config/site';
import { PageSection as Section } from '@/components/shared/PageSection';

export const metadata: Metadata = {
  title: 'Contato',
  description: `Fale com o ${site.name}: erros nas contas, sugestões de calculadoras e parcerias.`,
};

export default function ContactPage() {
  return (
    <article className="max-w-3xl leading-relaxed">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Contato</h1>

      {site.contactEmail ? (
        <a
          href={`mailto:${site.contactEmail}`}
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 font-medium text-white transition hover:bg-brand-700"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          {site.contactEmail}
        </a>
      ) : (
        <p className="mt-6 text-gray-600">O e-mail de contato ainda não foi configurado.</p>
      )}

      <Section title="Encontrou um erro numa conta?">
        <p>
          Use &ldquo;Copiar link do cálculo&rdquo; abaixo do resultado e mande o link no e-mail, contando qual valor
          você esperava. Assim conseguimos refazer exatamente a mesma conta.
        </p>
      </Section>

      <Section title="Sugestões">
        <p>Sentiu falta de alguma calculadora ou de alguma explicação? Conte para a gente.</p>
      </Section>

      <Section title="Parcerias e publicidade">
        <p>Para anunciar ou propor uma parceria, escreva com o assunto &ldquo;Parceria&rdquo;.</p>
      </Section>

      <Section title="Privacidade e dados pessoais">
        <p>
          Pedidos relacionados à LGPD podem ser enviados para o mesmo e-mail. Veja também a{' '}
          <Link href="/privacidade" className="font-medium text-brand-700 underline">
            política de privacidade
          </Link>
          .
        </p>
      </Section>

      <p className="mt-6 text-sm text-gray-500">
        O {site.name} não presta consultoria jurídica nem contábil e não consegue analisar casos individuais.
      </p>

      <p className="mt-10 text-sm">
        <Link href="/" className="font-medium text-brand-700 underline">
          Voltar para as calculadoras
        </Link>
      </p>
    </article>
  );
}
