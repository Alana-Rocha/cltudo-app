'use client';

import { usePathname } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { offers as defaultOffers, type Offer } from '@/content/offers';

export function SponsoredOffer({ offers = defaultOffers }: { offers?: Partial<Record<string, Offer>> }) {
  const pathname = usePathname();
  const offer = offers[(pathname ?? '').replace(/^\//, '')];
  if (!offer) return null;

  return (
    <aside aria-label={`Oferta de parceiro: ${offer.partner}`} className="border-t bg-gray-50 px-6 py-5 print:hidden">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Parceiro · {offer.partner}</p>
      <p className="mt-1 font-semibold">{offer.title}</p>
      <p className="mt-1 text-sm text-gray-600">{offer.description}</p>
      <a
        href={offer.href}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
      >
        {offer.cta}
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
      </a>
    </aside>
  );
}
