'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import { categories, registry, type CalculatorEntry } from '@/registry';
import { CalculatorIcon } from '@/components/ui/CalculatorIcon';

const FEATURED = ['calculadora-salario-liquido', 'calculadora-rescisao', 'calculadora-ferias', 'calculadora-clt-x-pj'];

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function CalculatorCard({ calc }: { calc: CalculatorEntry }) {
  if (calc.status !== 'available') {
    return (
      <div className="flex gap-3 rounded-xl border bg-gray-50 p-4 opacity-60">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-gray-500">
          <CalculatorIcon name={calc.icon} className="h-4 w-4" />
        </span>
        <span>
          <h3 className="font-semibold">{calc.title}</h3>
          <p className="mt-0.5 text-sm text-gray-500">{calc.shortDescription}</p>
          <span className="mt-2 inline-block rounded-full bg-gray-200 px-2 py-0.5 text-xs">Em breve</span>
        </span>
      </div>
    );
  }

  return (
    <Link href={`/${calc.slug}`} className="card group flex gap-3 p-4 transition hover:border-brand-500 hover:shadow-md">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition group-hover:bg-brand-100">
        <CalculatorIcon name={calc.icon} className="h-4 w-4" />
      </span>
      <span>
        <h3 className="font-semibold">{calc.title}</h3>
        <p className="mt-0.5 text-sm text-gray-500">{calc.shortDescription}</p>
      </span>
    </Link>
  );
}

function FeaturedCard({ calc }: { calc: CalculatorEntry }) {
  return (
    <Link href={`/${calc.slug}`} className="card group flex flex-col p-4 transition sm:p-5 hover:border-brand-500 hover:shadow-md">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
        <CalculatorIcon name={calc.icon} className="h-5 w-5" />
      </span>
      <h3 className="mt-3 font-semibold sm:mt-4 sm:text-lg">{calc.title}</h3>
      <p className="mt-1 hidden flex-1 text-sm text-gray-500 sm:block">{calc.shortDescription}</p>
      <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-medium text-brand-700 sm:pt-4">
        Calcular
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  );
}

export function CalculatorDirectory({ rulesLabel }: { rulesLabel: string }) {
  const [query, setQuery] = useState('');
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  const searching = terms.length > 0;
  const available = registry.filter((c) => c.status === 'available');

  const matches = registry.filter((calc) => {
    const haystack = normalize(`${calc.title} ${calc.shortDescription}`);
    return terms.every((t) => haystack.includes(t));
  });
  const featured = FEATURED.map((slug) => registry.find((c) => c.slug === slug)).filter(
    (c): c is CalculatorEntry => c !== undefined
  );

  return (
    <div>
      <section className="hero">
        <span className="chip">
          Regras de {rulesLabel}
          <span className="hidden sm:inline">· INSS, IRRF e FGTS atualizados</span>
        </span>
        <h1 className="mt-5 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Calcule seus direitos trabalhistas
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-gray-600">
          {available.length} calculadoras para salário, rescisão, férias, 13º, FGTS e mais, com o passo a
          passo de cada conta. Gratuito e sem cadastro.
        </p>

        <label htmlFor="calc-search" className="sr-only">
          Buscar calculadora
        </label>
        <div className="mt-8 flex max-w-xl items-center gap-2 rounded-xl border bg-white px-4 shadow-sm focus-within:ring-2 focus-within:ring-brand-500">
          <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          <input
            id="calc-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar: férias, rescisão, hora extra…"
            className="w-full border-0 bg-transparent py-3.5 text-base focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                document.getElementById('calc-search')?.focus();
              }}
              aria-label="Limpar busca"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </section>

      {!searching && (
        <section className="mt-12" aria-labelledby="featured-title">
          <h2 id="featured-title" className="text-xl font-semibold">
            Mais usadas
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {featured.map((calc) => (
              <FeaturedCard key={calc.slug} calc={calc} />
            ))}
          </div>
        </section>
      )}

      {searching && matches.length === 0 && (
        <p className="mt-10 text-center text-sm text-gray-500">Nenhuma calculadora encontrada para “{query}”.</p>
      )}

      {categories.map((category) => {
        const items = matches.filter((c) => c.category === category.id);
        if (items.length === 0) return null;
        return (
          <section key={category.id} id={category.id} className="mt-10 scroll-mt-24">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{category.title}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((calc) => (
                <CalculatorCard key={calc.slug} calc={calc} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
