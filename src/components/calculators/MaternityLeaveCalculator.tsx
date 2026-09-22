'use client';

import { useState } from 'react';
import { usePersistedState } from '@/hooks/usePersistedState';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { CalculationBreakdown } from '@/components/shared/CalculationBreakdown';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { calculateMaternityLeave } from '@/engine/maternityLeave';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';
import type { CalculationResult } from '@/engine/types';

function parseBrNumber(input: string): number {
  const value = Number(input.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) ? value : 0;
}

export function MaternityLeaveCalculator() {
  const [amount, setAmount] = usePersistedState('calculadora-salario-maternidade:amount', '');
  const [extended, setExtended] = usePersistedState('calculadora-salario-maternidade:extended', false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cents = toCents(parseBrNumber(amount));
    if (cents <= 0) return setError('Informe uma remuneração mensal maior que zero.');
    setError(null);
    setResult(calculateMaternityLeave({ monthlyAmount: cents, extendedProgram: extended }, getRulesFor(new Date())));
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
        <CurrencyInput id="amount" label="Remuneração mensal integral (empregada CLT)" value={amount} onChange={setAmount} required error={error ?? undefined} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={extended} onChange={(e) => setExtended(e.target.checked)} />
          Empresa participa do Programa Empresa Cidadã (180 dias)
        </label>
        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Calcular
        </button>
      </form>
      {result && <CalculationBreakdown result={result} />}
      <Disclaimer />
    </div>
  );
}
