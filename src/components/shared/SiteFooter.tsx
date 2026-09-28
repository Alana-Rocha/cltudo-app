import Link from 'next/link';
import { categories, registry } from '@/registry';
import { Logo } from '@/components/ui/Logo';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-white print:hidden">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-3 max-w-xs text-sm font-medium text-gray-600">Seus direitos trabalhistas, na ponta do lápis.</p>
          <p className="mt-2 max-w-xs text-sm text-gray-500">
            Gratuito e sem cadastro. Os valores são estimativas informativas e não substituem o
            holerite nem a orientação de um profissional.
          </p>
        </div>
        {categories.map((category) => (
          <div key={category.id}>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{category.title}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {registry
                .filter((c) => c.category === category.id && c.status === 'available')
                .map((c) => (
                  <li key={c.slug}>
                    <Link href={`/${c.slug}`} className="text-gray-600 hover:text-brand-700">
                      {c.title}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
