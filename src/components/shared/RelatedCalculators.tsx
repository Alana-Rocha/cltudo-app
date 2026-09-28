'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { registry, type CalculatorEntry } from '@/registry';
import { CalculatorIcon } from '@/components/ui/CalculatorIcon';

export function RelatedCalculators() {
  const pathname = usePathname();
  const current = registry.find((c) => `/${c.slug}` === pathname);
  if (!current) return null;

  const related = current.related
    .map((slug) => registry.find((c) => c.slug === slug))
    .filter((c): c is CalculatorEntry => c !== undefined && c.status === 'available');
  if (related.length === 0) return null;

  return (
    <nav aria-labelledby="related-title" className="mt-12">
      <h2 id="related-title" className="text-lg font-semibold">
        Calculadoras relacionadas
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {related.map((calc) => (
          <Link
            key={calc.slug}
            href={`/${calc.slug}`}
            className="group flex items-center gap-3 rounded-lg border bg-white p-4 transition hover:border-brand-500"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700 transition group-hover:bg-brand-100">
              <CalculatorIcon name={calc.icon} className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-medium">{calc.title}</span>
              <span className="block text-xs text-gray-500">{calc.shortDescription}</span>
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
