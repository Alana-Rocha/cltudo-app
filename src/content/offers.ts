/**
 * Ofertas de parceiros exibidas abaixo do resultado, por calculadora (slug do
 * registry). Deixe vazio até fechar uma parceria; a calculadora sem oferta
 * não mostra nada.
 *
 * Exemplo:
 *   'calculadora-clt-x-pj': {
 *     partner: 'Nome do parceiro',
 *     title: 'Vai virar PJ? Abra seu CNPJ com contador online',
 *     description: 'Abertura grátis e contabilidade a partir de R$ X/mês.',
 *     cta: 'Conhecer',
 *     href: 'https://parceiro.com.br/?utm_source=cltudo&utm_medium=calculadora&utm_campaign=clt-x-pj',
 *   },
 */
export type Offer = {
  partner: string;
  title: string;
  description: string;
  cta: string;
  href: string;
};

export const offers: Partial<Record<string, Offer>> = {};
