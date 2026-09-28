'use client';

import Link from 'next/link';
import { setConsent, useConsent } from '@/lib/consent';

export function CookieBanner() {
  const consent = useConsent();
  if (consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-20 px-4 print:hidden"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
    >
      <div className="card mx-auto flex max-w-3xl flex-col gap-4 p-5 shadow-lg sm:flex-row sm:items-center">
        <p className="text-sm text-gray-600">
          Usamos cookies para medir o uso do site e exibir anúncios. Os valores que você digita ficam só no seu
          navegador. Saiba mais na{' '}
          <Link href="/privacidade" className="font-medium text-brand-700 underline">
            política de privacidade
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => {
              setConsent('rejected');
              // Scripts de terceiros já carregados só saem da página recarregando.
              if ('gtag' in window || window.adsbygoogle) window.location.reload();
            }}
            className="rounded-md border px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-brand-500"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={() => setConsent('accepted')}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}

export function CookiePreferencesButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => setConsent(null)} className={className}>
      Preferências de cookies
    </button>
  );
}
