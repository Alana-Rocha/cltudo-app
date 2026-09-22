'use client';

import { useState } from 'react';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { CalculationBreakdown } from '@/components/shared/CalculationBreakdown';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { calculateHazardPay } from '@/engine/hazardPay';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';
import type { CalculationResult } from '@/engine/types';

function parseBrNumber(input: string): number {
  const value = Number(input.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) ? value : 0;
}

export function HazardPayCalculator() {
  const [salary, setSalary] = useState('');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cents = toCents(parseBrNumber(salary));
    if (cents <= 0) return setError('Informe um salário base maior que zero.');
    setError(null);
    setResult(calculateHazardPay({ baseSalary: cents }, getRulesFor(new Date())));
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
        <CurrencyInput id="salary" label="Salário base (sem gratificações)" value={salary} onChange={setSalary} required error={error ?? undefined} />
        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Calcular
        </button>
      </form>
      {result && <CalculationBreakdown result={result} />}
      <Disclaimer />
    </div>
  );
}
