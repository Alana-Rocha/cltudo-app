'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { categories, registry, type CalculatorEntry } from '@/registry';
import { CalculatorIcon } from '@/components/ui/CalculatorIcon';

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function CalculatorCard({ calc }: { calc: CalculatorEntry }) {
  if (calc.status !== 'available') {
    return (
      <div className="flex gap-4 rounded-xl border bg-gray-50 p-5 opacity-60">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-gray-500">
          <CalculatorIcon name={calc.icon} className="h-5 w-5" />
        </span>
        <span>
          <h3 className="font-semibold">{calc.title}</h3>
          <p className="mt-1 text-sm text-gray-500">{calc.shortDescription}</p>
          <span className="mt-2 inline-block rounded-full bg-gray-200 px-2 py-0.5 text-xs">Em breve</span>
        </span>
      </div>
    );
  }

  return (
    <Link
      href={`/${calc.slug}`}
      className="group flex gap-4 rounded-xl border bg-white p-5 transition hover:border-brand-500 hover:shadow-sm"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition group-hover:bg-brand-100">
        <CalculatorIcon name={calc.icon} className="h-5 w-5" />
      </span>
      <span>
        <h3 className="font-semibold">{calc.title}</h3>
        <p className="mt-1 text-sm text-gray-500">{calc.shortDescription}</p>
      </span>
    </Link>
  );
}

export function CalculatorDirectory() {
  const [query, setQuery] = useState('');
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);

  const matches = registry.filter((calc) => {
    const haystack = normalize(`${calc.title} ${calc.shortDescription}`);
    return terms.every((t) => haystack.includes(t));
  });

  return (
    <div className="mt-8">
      <label htmlFor="calc-search" className="sr-only">
        Buscar calculadora
      </label>
      <div className="flex items-center gap-2 rounded-lg border bg-white px-3 focus-within:ring-2 focus-within:ring-brand-500">
        <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
        <input
          id="calc-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar: férias, rescisão, hora extra…"
          className="w-full border-0 bg-transparent py-2.5 focus:outline-none"
        />
      </div>

      {matches.length === 0 && (
        <p className="mt-8 text-center text-sm text-gray-500">Nenhuma calculadora encontrada para “{query}”.</p>
      )}

      {categories.map((category) => {
        const items = matches.filter((c) => c.category === category.id);
        if (items.length === 0) return null;
        return (
          <section key={category.id} className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{category.title}</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
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
