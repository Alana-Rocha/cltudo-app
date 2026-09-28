'use client';

import { usePersistedState } from '@/hooks/usePersistedState';
import { useLiveCalculation } from '@/hooks/useLiveCalculation';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { CalculationBreakdown } from '@/components/shared/CalculationBreakdown';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { calculateInssStandalone } from '@/engine/inss';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';
import type { CalculationResult } from '@/engine/types';

function parseBrNumber(input: string): number {
  const value = Number(input.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) ? value : 0;
}

export function InssCalculator() {
  const [salary, setSalary] = usePersistedState('calculadora-inss:salary', '');

  function compute(): CalculationResult | string {
    const cents = toCents(parseBrNumber(salary));
    if (cents <= 0) return 'Informe um salário maior que zero.';
    return calculateInssStandalone(cents, getRulesFor(new Date()));
  }

  const { result, error, handleSubmit, resultRef } = useLiveCalculation(compute());

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
        <CurrencyInput id="salary" label="Salário de contribuição" value={salary} onChange={setSalary} required error={error} />
        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Calcular
        </button>
      </form>
      <div ref={resultRef} className="scroll-mt-20">
        {result && <CalculationBreakdown result={result} headline={{ label: 'Desconto de INSS', field: 'deductions' }} />}
      </div>
      <Disclaimer />
    </div>
  );
}
