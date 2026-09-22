'use client';

import { useState } from 'react';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { NumberInput } from '@/components/ui/NumberInput';
import { CalculationBreakdown } from '@/components/shared/CalculationBreakdown';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { calculateCompTime } from '@/engine/compTime';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';
import type { CalculationResult } from '@/engine/types';

function parseBrNumber(input: string): number {
  const value = Number(input.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) ? value : 0;
}

export function CompTimeCalculator() {
  const [salary, setSalary] = useState('');
  const [monthlyHours, setMonthlyHours] = useState('220');
  const [balance, setBalance] = useState('0');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cents = toCents(parseBrNumber(salary));
    if (cents <= 0) return setError('Informe um salário maior que zero.');
    setError(null);
    setResult(
      calculateCompTime(
        { grossSalary: cents, monthlyHours: Number(monthlyHours) || 220, balanceHours: Number(balance) || 0 },
        getRulesFor(new Date())
      )
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
        <CurrencyInput id="salary" label="Salário bruto" value={salary} onChange={setSalary} required error={error ?? undefined} />
        <NumberInput id="monthlyHours" label="Jornada mensal (horas)" value={monthlyHours} onChange={setMonthlyHours} min={1} />
        <NumberInput id="balance" label="Saldo de horas (negativo se você deve horas)" value={balance} onChange={setBalance} />
        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Calcular
        </button>
      </form>
      {result && <CalculationBreakdown result={result} />}
      <Disclaimer />
    </div>
  );
}
