import Link from 'next/link';
import { registry } from '@/registry';
import { CalculatorIcon } from '@/components/ui/CalculatorIcon';

export default function HomePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Calculadora Trabalhista</h1>
      <p className="mt-2 text-gray-600">
        Calcule salário, rescisão, férias, 13º, FGTS e outros valores trabalhistas de forma simples
        — gratuito e sem cadastro.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {registry.map((calc) =>
          calc.status === 'available' ? (
            <Link
              key={calc.slug}
              href={`/${calc.slug}`}
              className="group flex gap-4 rounded-xl border bg-white p-5 transition hover:border-brand-500 hover:shadow-sm"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition group-hover:bg-brand-100">
                <CalculatorIcon name={calc.icon} className="h-5 w-5" />
              </span>
              <span>
                <h2 className="font-semibold">{calc.title}</h2>
                <p className="mt-1 text-sm text-gray-500">{calc.shortDescription}</p>
              </span>
            </Link>
          ) : (
            <div key={calc.slug} className="flex gap-4 rounded-xl border bg-gray-50 p-5 opacity-60">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-gray-500">
                <CalculatorIcon name={calc.icon} className="h-5 w-5" />
              </span>
              <span>
                <h2 className="font-semibold">{calc.title}</h2>
                <p className="mt-1 text-sm text-gray-500">{calc.shortDescription}</p>
                <span className="mt-2 inline-block rounded-full bg-gray-200 px-2 py-0.5 text-xs">
                  Em breve
                </span>
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
