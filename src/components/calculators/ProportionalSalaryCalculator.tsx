'use client';

import { useState } from 'react';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { NumberInput } from '@/components/ui/NumberInput';
import { CalculationBreakdown } from '@/components/shared/CalculationBreakdown';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { calculateProportionalSalary } from '@/engine/proportionalSalary';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';
import type { CalculationResult } from '@/engine/types';

function parseBrNumber(input: string): number {
  const value = Number(input.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) ? value : 0;
}

export function ProportionalSalaryCalculator() {
  const [salary, setSalary] = useState('');
  const [daysWorked, setDaysWorked] = useState('15');
  const [dependents, setDependents] = useState('0');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cents = toCents(parseBrNumber(salary));
    if (cents <= 0) return setError('Informe um salário mensal maior que zero.');
    setError(null);
    setResult(
      calculateProportionalSalary(
        { grossSalary: cents, daysWorked: Number(daysWorked) || 0, dependents: Number(dependents) || 0 },
        getRulesFor(new Date())
      )
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
        <CurrencyInput id="salary" label="Salário mensal integral" value={salary} onChange={setSalary} required error={error ?? undefined} />
        <NumberInput id="daysWorked" label="Dias trabalhados no mês" value={daysWorked} onChange={setDaysWorked} min={1} max={30} />
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
