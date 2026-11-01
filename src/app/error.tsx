'use client';

import Link from 'next/link';

/** Rede de segurança: um erro inesperado numa calculadora não derruba o site inteiro. */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <article className="max-w-3xl leading-relaxed">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Algo deu errado</h1>
      <p className="mt-4 text-gray-600">
        Não conseguimos mostrar esta página. Tente de novo; se o problema continuar, apague os dados deste site nas
        configurações do navegador e preencha a calculadora outra vez.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          Tentar de novo
        </button>
        <Link href="/" className="rounded-md border px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-brand-500">
          Voltar para as calculadoras
        </Link>
      </div>
    </article>
  );
}
