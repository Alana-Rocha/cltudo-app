import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/config/site';
import { registry } from '@/registry';
import { PageSection as Section } from '@/components/shared/PageSection';

export const metadata: Metadata = {
  title: 'Sobre',
  description: `O que é o ${site.name}, como as contas são feitas e como o site se mantém.`,
};

export default function AboutPage() {
  const available = registry.filter((c) => c.status === 'available').length;

  return (
    <article className="max-w-3xl leading-relaxed">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Sobre o {site.name}</h1>
      <p className="mt-2 text-lg text-gray-600">{site.tagline}</p>

      <p className="mt-6 text-gray-600">
        O {site.name} reúne {available} calculadoras trabalhistas gratuitas, sem cadastro, para quem trabalha com
        carteira assinada e para quem contrata. A ideia é simples: além de mostrar o resultado, mostrar a conta,
        para que você entenda de onde vem cada valor do seu holerite, da sua rescisão ou das suas férias.
      </p>

      <Section title="Como as contas são feitas">
        <p>
          Cada calculadora segue a CLT e as tabelas oficiais vigentes — faixas de INSS e IRRF, salário mínimo, teto do
          INSS, entre outras. Essas regras são guardadas separadamente por data de vigência, com as fontes oficiais
          registradas, e o site escolhe automaticamente o conjunto válido para a data do cálculo (por exemplo, a data
          do desligamento numa rescisão).
        </p>
        <p>
          Todo resultado vem com o passo a passo, para você conferir cada etapa e comparar com o que recebeu.
        </p>
      </Section>

      <Section title="Seus dados ficam com você">
        <p>
          Os cálculos acontecem no seu navegador. Salário, datas e demais valores não são enviados para nenhum
          servidor. Os detalhes estão na{' '}
          <Link href="/privacidade" className="font-medium text-brand-700 underline">
            política de privacidade
          </Link>
          .
        </p>
      </Section>

      <Section title="Limites">
        <p>
          Os valores são estimativas informativas. Convenções coletivas, acordos individuais, benefícios e situações
          específicas podem mudar o resultado. Para valores oficiais, consulte seu holerite, a empresa, um contador ou
          um advogado trabalhista.
        </p>
      </Section>

      <Section title="Como o site se mantém">
        <p>
          O {site.name} é gratuito e se mantém com anúncios e com ofertas de parceiros, sempre identificados como
          &ldquo;Publicidade&rdquo; ou &ldquo;Parceiro&rdquo;. Eles nunca aparecem entre o formulário e o resultado e
          não influenciam as contas.
        </p>
      </Section>

      <Section title="Encontrou um erro?">
        <p>
          Se uma conta não bate ou uma regra mudou, queremos saber.{' '}
          <Link href="/contato" className="font-medium text-brand-700 underline">
            Fale com a gente
          </Link>
          .
        </p>
      </Section>

      <p className="mt-10 text-sm">
        <Link href="/" className="font-medium text-brand-700 underline">
          Voltar para as calculadoras
        </Link>
      </p>
    </article>
  );
}
