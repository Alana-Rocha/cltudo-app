'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { categories, registry } from '@/registry';

export function Breadcrumb() {
  const pathname = usePathname();
  const current = registry.find((c) => `/${c.slug}` === pathname);
  if (!current) return null;
  const category = categories.find((c) => c.id === current.category);

  return (
    <nav aria-label="Você está em" className="mb-3 print:hidden">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-gray-500">
        <li>
          <Link href="/" className="hover:text-brand-700">
            Início
          </Link>
        </li>
        {category && (
          <li className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
            <Link href={`/#${category.id}`} className="hover:text-brand-700">
              {category.title}
            </Link>
          </li>
        )}
      </ol>
    </nav>
  );
}
