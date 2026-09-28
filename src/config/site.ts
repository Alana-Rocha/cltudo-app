/**
 * Identidade do site e integrações de terceiros. Tudo que depende de conta
 * externa vem de variável de ambiente: sem o ID, a integração simplesmente
 * não é carregada.
 */
export const site = {
  name: 'CLTudo',
  tagline: 'Seus direitos trabalhistas, na ponta do lápis.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? 'https://cltudo.example.com',
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? '',
  analytics: {
    gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? '',
  },
  ads: {
    adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '', // ca-pub-...
    adsenseSlot: process.env.NEXT_PUBLIC_ADSENSE_SLOT ?? '',
  },
};
