'use client';

import { useState } from 'react';
import { usePersistedState } from '@/hooks/usePersistedState';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { NumberInput } from '@/components/ui/NumberInput';
import { CalculationBreakdown } from '@/components/shared/CalculationBreakdown';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { calculateVacation } from '@/engine/vacation';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';
import type { CalculationResult } from '@/engine/types';

function parseBrNumber(input: string): number {
  const value = Number(input.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) ? value : 0;
}

export function VacationCalculator() {
  const [gross, setGross] = usePersistedState('calculadora-ferias:gross', '');
  const [daysTaken, setDaysTaken] = usePersistedState('calculadora-ferias:daysTaken', '30');
  const [daysSold, setDaysSold] = usePersistedState('calculadora-ferias:daysSold', '0');
  const [dependents, setDependents] = usePersistedState('calculadora-ferias:dependents', '0');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const grossCents = toCents(parseBrNumber(gross));
    const taken = Number(daysTaken) || 0;
    const sold = Number(daysSold) || 0;
    if (grossCents <= 0) return setError('Informe um salário bruto maior que zero.');
    if (taken + sold > 30) return setError('Dias gozados + dias vendidos não pode ultrapassar 30.');
    setError(null);
    try {
      const rules = getRulesFor(new Date());
      setResult(
        calculateVacation({ grossSalary: grossCents, daysTaken: taken, daysSold: sold, dependents: Number(dependents) || 0 }, rules)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível calcular.');
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
        <CurrencyInput id="gross" label="Salário bruto" value={gross} onChange={setGross} required error={error ?? undefined} />
        <NumberInput id="taken" label="Dias de férias a gozar" value={daysTaken} onChange={setDaysTaken} min={1} max={30} />
        <NumberInput id="sold" label="Dias de abono (venda)" value={daysSold} onChange={setDaysSold} min={0} max={10} hint="Até 10 de 30 dias" />
        <NumberInput id="dependents" label="Número de dependentes" value={dependents} onChange={setDependents} min={0} />
        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Calcular
        </button>
      </form>
      {result && <CalculationBreakdown result={result} />}
      <Disclaimer />
    </div>
  );
}
