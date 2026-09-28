'use client';

import { usePersistedState } from '@/hooks/usePersistedState';
import { useLiveCalculation } from '@/hooks/useLiveCalculation';
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
  const [salary, setSalary] = usePersistedState('calculadora-banco-de-horas:salary', '');
  const [monthlyHours, setMonthlyHours] = usePersistedState('calculadora-banco-de-horas:monthlyHours', '220');
  const [balance, setBalance] = usePersistedState('calculadora-banco-de-horas:balance', '0');

  function compute(): CalculationResult | string {
    const cents = toCents(parseBrNumber(salary));
    if (cents <= 0) return 'Informe um salário maior que zero.';
    return calculateCompTime(
      { grossSalary: cents, monthlyHours: Number(monthlyHours) || 220, balanceHours: Number(balance) || 0 },
      getRulesFor(new Date())
    );
  }

  const { result, error, handleSubmit, resultRef } = useLiveCalculation(compute());

  return (
    <div className="calc-layout">
      <form onSubmit={handleSubmit} noValidate className="card space-y-4 p-6">
        <CurrencyInput id="salary" label="Salário bruto" value={salary} onChange={setSalary} required error={error} />
        <NumberInput id="monthlyHours" decimal label="Jornada mensal (horas)" value={monthlyHours} onChange={setMonthlyHours} min={1} />
        <NumberInput id="balance" decimal negative label="Saldo de horas (negativo se você deve horas)" value={balance} onChange={setBalance} />
        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Calcular
        </button>
      </form>
      <div ref={resultRef} className="calc-result scroll-mt-20">
        {result && <CalculationBreakdown result={result} headline={{ label: 'Valor a receber pelo banco de horas' }} />}
      </div>
      <Disclaimer />
    </div>
  );
}
