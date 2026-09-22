import Link from 'next/link';
import { registry } from '@/registry';

export default function HomePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Calculadora Trabalhista</h1>
      <p className="mt-2 text-gray-600">
        Calcule salário, rescisão, férias, 13º, FGTS e outros valores trabalhistas de forma simples.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {registry.map((calc) =>
          calc.status === 'available' ? (
            <Link
              key={calc.slug}
              href={`/${calc.slug}`}
              className="rounded-lg border bg-white p-5 transition hover:border-brand-500 hover:shadow-sm"
            >
              <h2 className="font-semibold">{calc.title}</h2>
              <p className="mt-1 text-sm text-gray-500">{calc.shortDescription}</p>
            </Link>
          ) : (
            <div key={calc.slug} className="rounded-lg border bg-gray-50 p-5 opacity-60">
              <h2 className="font-semibold">{calc.title}</h2>
              <p className="mt-1 text-sm text-gray-500">{calc.shortDescription}</p>
              <span className="mt-2 inline-block rounded-full bg-gray-200 px-2 py-0.5 text-xs">
                Em breve
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
