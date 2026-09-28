'use client';

import { usePersistedState } from '@/hooks/usePersistedState';
import { useLiveCalculation } from '@/hooks/useLiveCalculation';
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
  const [salary, setSalary] = usePersistedState('calculadora-periculosidade:salary', '');

  function compute(): CalculationResult | string {
    const cents = toCents(parseBrNumber(salary));
    if (cents <= 0) return 'Informe um salário base maior que zero.';
    return calculateHazardPay({ baseSalary: cents }, getRulesFor(new Date()));
  }

  const { result, error, handleSubmit, resultRef } = useLiveCalculation(compute());

  return (
    <div className="calc-layout">
      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <CurrencyInput id="salary" label="Salário base (sem gratificações)" value={salary} onChange={setSalary} required error={error} />
        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Calcular
        </button>
      </form>
      <div ref={resultRef} className="calc-result scroll-mt-20">
        {result && <CalculationBreakdown result={result} headline={{ label: 'Adicional de periculosidade (mensal)' }} />}
      </div>
      <Disclaimer />
    </div>
  );
}
