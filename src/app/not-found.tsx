import Link from 'next/link';
import { Compass } from 'lucide-react';
import { registry } from '@/registry';
import { CalculatorIcon } from '@/components/ui/CalculatorIcon';

export default function NotFound() {
  const suggestions = registry.filter((c) => c.status === 'available').slice(0, 4);

  return (
    <div className="flex flex-col items-center py-12 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <Compass className="h-8 w-8" aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-2xl font-bold">Página não encontrada</h1>
      <p className="mt-2 max-w-sm text-gray-600">
        O endereço digitado não existe ou foi movido. Que tal uma destas calculadoras?
      </p>

      <div className="mt-8 grid w-full max-w-lg gap-3 sm:grid-cols-2">
        {suggestions.map((calc) => (
          <Link
            key={calc.slug}
            href={`/${calc.slug}`}
            className="flex items-center gap-3 rounded-lg border bg-white p-4 text-left transition hover:border-brand-500 hover:shadow-sm"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <CalculatorIcon name={calc.icon} className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium">{calc.title}</span>
          </Link>
        ))}
      </div>

      <Link href="/" className="mt-8 text-sm font-medium text-brand-700 underline">
        Ver todas as calculadoras
      </Link>
    </div>
  );
}
