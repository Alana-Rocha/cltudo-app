'use client';

import Script from 'next/script';
import { site } from '@/config/site';
import { useConsent } from '@/lib/consent';

/** Analytics e anúncios só carregam depois do "Aceitar" e se o ID estiver configurado. */
export function ThirdPartyScripts() {
  const consent = useConsent();
  if (consent !== 'accepted') return null;

  const { gaMeasurementId } = site.analytics;
  const { adsenseClient } = site.ads;

  return (
    <>
      {gaMeasurementId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaMeasurementId)}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${JSON.stringify(gaMeasurementId)});`}
          </Script>
        </>
      )}
      {adsenseClient && (
        <Script
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsenseClient)}`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      )}
    </>
  );
}
