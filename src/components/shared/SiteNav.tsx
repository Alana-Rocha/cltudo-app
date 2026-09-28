'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/calculadora-salario-liquido', label: 'Salário líquido' },
  { href: '/calculadora-rescisao', label: 'Rescisão' },
  { href: '/calculadora-ferias', label: 'Férias' },
  { href: '/calculadora-clt-x-pj', label: 'CLT x PJ' },
];

export function SiteNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Principais calculadoras" className="hidden items-center gap-1 md:flex">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              active ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:text-brand-700'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
      <Link href="/" className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:text-brand-700">
        Todas
      </Link>
    </nav>
  );
}
