'use client';

import { useState } from 'react';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { NumberInput } from '@/components/ui/NumberInput';
import { CalculationBreakdown } from '@/components/shared/CalculationBreakdown';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { calculateThirteenth } from '@/engine/thirteenth';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';
import type { CalculationResult } from '@/engine/types';

function parseBrNumber(input: string): number {
  const value = Number(input.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) ? value : 0;
}

export function ThirteenthCalculator() {
  const [gross, setGross] = useState('');
  const [months, setMonths] = useState('12');
  const [dependents, setDependents] = useState('0');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const grossCents = toCents(parseBrNumber(gross));
    if (grossCents <= 0) return setError('Informe um salário bruto maior que zero.');
    setError(null);
    const rules = getRulesFor(new Date());
    setResult(
      calculateThirteenth(
        { grossSalary: grossCents, monthsWorked: Number(months) || 0, dependents: Number(dependents) || 0 },
        rules
      )
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
        <CurrencyInput id="gross" label="Salário bruto" value={gross} onChange={setGross} required error={error ?? undefined} />
        <NumberInput id="months" label="Meses trabalhados no ano" value={months} onChange={setMonths} min={0} max={12} hint="Conte 1 mês para cada 15 dias ou mais trabalhados" />
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
