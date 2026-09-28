'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { site } from '@/config/site';
import { useConsent } from '@/lib/consent';
import { registry } from '@/registry';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Espaço de anúncio abaixo da calculadora — nunca entre o formulário e o
 * resultado. Só aparece com consentimento e com cliente + slot do AdSense configurados.
 */
export function AdSlot() {
  const consent = useConsent();
  const pathname = usePathname();
  const pushed = useRef<string | null>(null);
  const onCalculator = registry.some((c) => `/${c.slug}` === pathname);
  const { adsenseClient, adsenseSlot } = site.ads;
  const enabled = consent === 'accepted' && onCalculator && Boolean(adsenseClient && adsenseSlot);

  useEffect(() => {
    if (!enabled || pushed.current === pathname) return;
    pushed.current = pathname;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // bloqueador de anúncios ou script ainda carregando
    }
  }, [enabled, pathname]);

  if (!enabled) return null;

  return (
    <aside aria-label="Publicidade" className="mt-12 print:hidden">
      <p className="mb-1 text-center text-[11px] uppercase tracking-wide text-gray-400">Publicidade</p>
      <ins
        key={pathname}
        className="adsbygoogle block"
        style={{ display: 'block', minHeight: 100 }}
        data-ad-client={adsenseClient}
        data-ad-slot={adsenseSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
