import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/config/site';
import { CookiePreferencesButton } from '@/components/shared/CookieBanner';

export const metadata: Metadata = {
  title: 'Política de privacidade',
  description: `Como o ${site.name} trata os dados de quem usa as calculadoras.`,
};

const LAST_UPDATED = '27 de setembro de 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-2 space-y-3 text-gray-600">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl leading-relaxed">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Política de privacidade</h1>
      <p className="mt-2 text-sm text-gray-500">Última atualização: {LAST_UPDATED}</p>

      <p className="mt-6 text-gray-600">
        Esta política explica quais dados o {site.name} usa, para quê e quais são os seus direitos, conforme a Lei
        Geral de Proteção de Dados (Lei 13.709/2018).
      </p>

      <Section title="Os valores que você digita">
        <p>
          Os cálculos são feitos no seu próprio navegador. Salário, datas e demais valores <strong>não são enviados</strong>{' '}
          para nenhum servidor do {site.name}.
        </p>
        <p>
          Para você não perder o que preencheu ao recarregar a página, esses valores ficam guardados no armazenamento
          local do seu navegador (localStorage). Eles não saem do seu dispositivo e você pode apagá-los limpando os
          dados deste site nas configurações do navegador.
        </p>
      </Section>

      <Section title="Links compartilhados">
        <p>
          Ao usar &ldquo;Copiar link do cálculo&rdquo;, os valores preenchidos vão codificados no próprio endereço. Quem
          receber o link consegue ver esses valores. O {site.name} não guarda cópia dos links gerados.
        </p>
      </Section>

      <Section title="Cookies de medição e publicidade">
        <p>
          Com o seu consentimento, podemos usar ferramentas de terceiros para medir o uso do site de forma agregada
          (como o Google Analytics) e exibir anúncios (como o Google AdSense). Essas ferramentas usam cookies e podem
          coletar dados como endereço IP, tipo de navegador e páginas visitadas, conforme as políticas do Google.
        </p>
        <p>
          Nada disso é carregado antes de você clicar em &ldquo;Aceitar&rdquo;. Se recusar, o site funciona
          normalmente. Você pode mudar sua escolha quando quiser: <CookiePreferencesButton className="font-medium text-brand-700 underline" />.
        </p>
      </Section>

      <Section title="Links de parceiros">
        <p>
          Algumas calculadoras mostram ofertas de parceiros, sempre identificadas como &ldquo;Parceiro&rdquo;. Ao clicar,
          você vai para o site do parceiro, que tem sua própria política de privacidade. O {site.name} pode receber
          uma comissão quando você contrata algo por esses links, sem custo a mais para você.
        </p>
      </Section>

      <Section title="Base legal">
        <p>
          Os cookies de medição e publicidade dependem do seu consentimento (art. 7º, I, da LGPD), que pode ser
          revogado a qualquer momento. O armazenamento local dos valores digitados é necessário para o funcionamento
          das calculadoras e fica restrito ao seu dispositivo.
        </p>
      </Section>

      <Section title="Seus direitos">
        <p>
          Você pode pedir confirmação de tratamento, acesso, correção, anonimização, portabilidade ou eliminação de
          dados, além de informações sobre compartilhamento e a revogação do consentimento (art. 18 da LGPD).
        </p>
        {site.contactEmail && (
          <p>
            Para exercer esses direitos ou tirar dúvidas, escreva para{' '}
            <a href={`mailto:${site.contactEmail}`} className="font-medium text-brand-700 underline">
              {site.contactEmail}
            </a>
            .
          </p>
        )}
      </Section>

      <Section title="Mudanças nesta política">
        <p>
          Se esta política mudar de forma relevante, atualizaremos a data acima e pediremos seu consentimento de novo
          quando for necessário.
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
