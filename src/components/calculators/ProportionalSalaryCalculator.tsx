'use client';

import { usePersistedState } from '@/hooks/usePersistedState';
import { useLiveCalculation } from '@/hooks/useLiveCalculation';
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
  const [salary, setSalary] = usePersistedState('calculadora-salario-proporcional:salary', '');
  const [daysWorked, setDaysWorked] = usePersistedState('calculadora-salario-proporcional:daysWorked', '15');
  const [dependents, setDependents] = usePersistedState('calculadora-salario-proporcional:dependents', '0');
  function compute(): CalculationResult | string {
    const cents = toCents(parseBrNumber(salary));
    if (cents <= 0) return 'Informe um salário mensal maior que zero.';
    return calculateProportionalSalary(
      { grossSalary: cents, daysWorked: Number(daysWorked) || 0, dependents: Number(dependents) || 0 },
      getRulesFor(new Date())
    );
  }

  const { result, error, handleSubmit, resultRef } = useLiveCalculation(compute());

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
        <CurrencyInput id="salary" label="Salário mensal integral" value={salary} onChange={setSalary} required error={error} />
        <NumberInput id="daysWorked" label="Dias trabalhados no mês" value={daysWorked} onChange={setDaysWorked} min={1} max={30} />
        <NumberInput id="dependents" label="Número de dependentes" value={dependents} onChange={setDependents} min={0} />
        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Calcular
        </button>
      </form>
      <div ref={resultRef} className="scroll-mt-20">
        {result && <CalculationBreakdown result={result} headline={{ label: 'Salário proporcional líquido' }} />}
      </div>
      <Disclaimer />
    </div>
  );
}
