'use client';

import { useState } from 'react';
import { usePersistedState } from '@/hooks/usePersistedState';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { NumberInput } from '@/components/ui/NumberInput';
import { CalculationBreakdown } from '@/components/shared/CalculationBreakdown';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { calculateNightShift } from '@/engine/nightShift';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';
import type { CalculationResult } from '@/engine/types';

function parseBrNumber(input: string): number {
  const value = Number(input.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) ? value : 0;
}

export function NightShiftCalculator() {
  const [salary, setSalary] = usePersistedState('calculadora-adicional-noturno:salary', '');
  const [monthlyHours, setMonthlyHours] = usePersistedState('calculadora-adicional-noturno:monthlyHours', '220');
  const [nightHours, setNightHours] = usePersistedState('calculadora-adicional-noturno:nightHours', '0');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const salaryCents = toCents(parseBrNumber(salary));
    if (salaryCents <= 0) return setError('Informe um salário maior que zero.');
    setError(null);
    const rules = getRulesFor(new Date());
    setResult(
      calculateNightShift(
        { grossSalary: salaryCents, monthlyHours: Number(monthlyHours) || 220, nightHoursWorked: Number(nightHours) || 0 },
        rules
      )
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
        <CurrencyInput id="salary" label="Salário bruto" value={salary} onChange={setSalary} required error={error ?? undefined} />
        <NumberInput id="monthlyHours" label="Jornada mensal (horas)" value={monthlyHours} onChange={setMonthlyHours} min={1} />
        <NumberInput id="nightHours" label="Horas trabalhadas no período noturno (22h–5h)" value={nightHours} onChange={setNightHours} min={0} />
        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Calcular
        </button>
      </form>
      {result && <CalculationBreakdown result={result} />}
      <Disclaimer />
    </div>
  );
}
