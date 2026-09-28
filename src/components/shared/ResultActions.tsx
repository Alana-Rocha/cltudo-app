'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Check, Link2, Printer } from 'lucide-react';
import { buildShareUrl } from '@/lib/shareState';

export function ResultActions() {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  async function copyLink() {
    const url = buildShareUrl((pathname ?? '').replace(/^\//, ''));
    try {
      await navigator.clipboard.writeText(url);
      setFallbackUrl(null);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setFallbackUrl(url);
    }
  }

  const buttonClass =
    'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:border-brand-500';

  return (
    <div className="print:hidden">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copyLink} className={buttonClass}>
          {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
          {copied ? 'Link copiado' : 'Copiar link do cálculo'}
        </button>
        <button type="button" onClick={() => window.print()} className={buttonClass}>
          <Printer className="h-4 w-4" aria-hidden="true" />
          Imprimir
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {copied ? 'Link copiado para a área de transferência' : ''}
      </p>
      {fallbackUrl && (
        <div className="mt-2">
          <label htmlFor="share-url" className="text-xs text-gray-500">
            Copie o link abaixo:
          </label>
          <input
            id="share-url"
            readOnly
            value={fallbackUrl}
            onFocus={(e) => e.target.select()}
            className="mt-1 w-full rounded-md border px-2 py-1 text-xs"
          />
        </div>
      )}
    </div>
  );
}
