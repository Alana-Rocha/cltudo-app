import { formatCurrency } from '@/lib/format';
import type { CalculationResult } from '@/engine/types';

export type WorkedExample = {
  title: string;
  result: CalculationResult;
  highlight?: { value: number; caption: string }; // replaces the default net/first-item headline
};

export function WorkedExamples({ examples }: { examples: WorkedExample[] }) {
  return (
    <section className="mt-10 print:hidden" aria-labelledby="examples-heading">
      <h2 id="examples-heading" className="text-xl font-semibold">
        Exemplos resolvidos
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Calculados automaticamente pelo mesmo motor desta calculadora, com as regras vigentes.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {examples.map((example, i) => {
          const highlight =
            example.highlight?.value ??
            (example.result.totals.net !== 0 ? example.result.totals.net : example.result.items[0]?.amount ?? 0);
          return (
            <div key={i} className="rounded-lg border bg-white p-4">
              <p className="text-sm font-medium">{example.title}</p>
              <p className="mt-1 text-2xl font-bold text-brand-700">{formatCurrency(highlight)}</p>
              {example.highlight && <p className="text-xs text-gray-500">{example.highlight.caption}</p>}
              <ul className="mt-3 space-y-1 text-xs text-gray-500">
                {example.result.items.slice(0, 4).map((item) => (
                  <li key={item.key} className="flex justify-between">
                    <span>{item.label}</span>
                    <span>{formatCurrency(Math.abs(item.amount))}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
