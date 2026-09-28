'use client';

import { usePersistedState } from '@/hooks/usePersistedState';
import { useLiveCalculation } from '@/hooks/useLiveCalculation';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { NumberInput } from '@/components/ui/NumberInput';
import { CalculationBreakdown } from '@/components/shared/CalculationBreakdown';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { calculateDsr } from '@/engine/dsr';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';
import type { CalculationResult } from '@/engine/types';

function parseBrNumber(input: string): number {
  const value = Number(input.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) ? value : 0;
}

export function DsrCalculator() {
  const [variableAmount, setVariableAmount] = usePersistedState('calculadora-dsr:variableAmount', '');
  const [workingDays, setWorkingDays] = usePersistedState('calculadora-dsr:workingDays', '22');
  const [sundaysHolidays, setSundaysHolidays] = usePersistedState('calculadora-dsr:sundaysHolidays', '4');

  function compute(): CalculationResult | string {
    const cents = toCents(parseBrNumber(variableAmount));
    if (cents <= 0) return 'Informe um valor de remuneração variável maior que zero.';
    return calculateDsr(
      { variableAmount: cents, workingDaysInMonth: Number(workingDays) || 22, sundaysAndHolidaysInMonth: Number(sundaysHolidays) || 0 },
      getRulesFor(new Date())
    );
  }

  const { result, error, handleSubmit, resultRef } = useLiveCalculation(compute());

  return (
    <div className="calc-layout">
      <form onSubmit={handleSubmit} noValidate className="card space-y-4 p-6">
        <CurrencyInput id="variable" label="Remuneração variável no mês (comissões, etc.)" value={variableAmount} onChange={setVariableAmount} required error={error} />
        <div className="grid grid-cols-2 gap-4">
          <NumberInput id="workingDays" label="Dias úteis no mês" value={workingDays} onChange={setWorkingDays} min={1} max={31} />
          <NumberInput id="sundaysHolidays" label="Domingos + feriados" value={sundaysHolidays} onChange={setSundaysHolidays} min={0} max={10} />
        </div>
        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Calcular
        </button>
      </form>
      <div ref={resultRef} className="calc-result scroll-mt-20">
        {result && <CalculationBreakdown result={result} headline={{ label: 'Variáveis + DSR' }} />}
      </div>
      <Disclaimer />
    </div>
  );
}
