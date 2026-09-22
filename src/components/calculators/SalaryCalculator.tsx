'use client';

import { useState } from 'react';
import { usePersistedState } from '@/hooks/usePersistedState';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { NumberInput } from '@/components/ui/NumberInput';
import { CalculationBreakdown } from '@/components/shared/CalculationBreakdown';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { calculateSalary } from '@/engine/salary';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';
import type { CalculationResult } from '@/engine/types';

function parseBrNumber(input: string): number {
  const normalized = input.replace(/\./g, '').replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}

export function SalaryCalculator() {
  const [gross, setGross] = usePersistedState('calculadora-salario-liquido:gross', '');
  const [dependents, setDependents] = usePersistedState('calculadora-salario-liquido:dependents', '0');
  const [showMore, setShowMore] = usePersistedState('calculadora-salario-liquido:showMore', false);
  const [alimony, setAlimony] = usePersistedState('calculadora-salario-liquido:alimony', '');
  const [hasVt, setHasVt] = usePersistedState('calculadora-salario-liquido:hasVt', false);
  const [vtValue, setVtValue] = usePersistedState('calculadora-salario-liquido:vtValue', '');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const grossCents = toCents(parseBrNumber(gross));
    if (grossCents <= 0) {
      setError('Informe um salário bruto maior que zero.');
      return;
    }
    setError(null);
    const rules = getRulesFor(new Date());
    setResult(
      calculateSalary(
        {
          grossSalary: grossCents,
          dependents: Number(dependents) || 0,
          alimony: alimony ? toCents(parseBrNumber(alimony)) : undefined,
          hasTransportVoucher: hasVt,
          transportVoucherValue: vtValue ? toCents(parseBrNumber(vtValue)) : undefined,
        },
        rules
      )
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
        <CurrencyInput id="gross" label="Salário bruto" value={gross} onChange={setGross} required error={error ?? undefined} />
        <NumberInput id="dependents" label="Número de dependentes" value={dependents} onChange={setDependents} min={0} />

        <button
          type="button"
          onClick={() => setShowMore((s) => !s)}
          className="text-sm font-medium text-brand-700 underline"
        >
          Mais opções
        </button>

        {showMore && (
          <div className="space-y-4 border-t pt-4">
            <CurrencyInput id="alimony" label="Pensão alimentícia (opcional)" value={alimony} onChange={setAlimony} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={hasVt} onChange={(e) => setHasVt(e.target.checked)} />
              Recebo vale-transporte
            </label>
            {hasVt && (
              <CurrencyInput id="vt" label="Valor da passagem (mensal)" value={vtValue} onChange={setVtValue} />
            )}
          </div>
        )}

        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Calcular
        </button>
      </form>

      {result && <CalculationBreakdown result={result} />}
      <Disclaimer />
    </div>
  );
}
