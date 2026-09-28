'use client';

import { usePersistedState } from '@/hooks/usePersistedState';
import { useLiveCalculation } from '@/hooks/useLiveCalculation';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { NumberInput } from '@/components/ui/NumberInput';
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
  const [dependents, setDependents] = usePersistedState('calculadora-salario-maternidade:dependents', '0');

  function compute(): CalculationResult | string {
    const cents = toCents(parseBrNumber(amount));
    if (cents <= 0) return 'Informe uma remuneração mensal maior que zero.';
    return calculateMaternityLeave(
      { monthlyAmount: cents, extendedProgram: extended, dependents: Number(dependents) || 0 },
      getRulesFor(new Date())
    );
  }

  const { result, error, handleSubmit, resultRef } = useLiveCalculation(compute());

  return (
    <div className="calc-layout">
      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <CurrencyInput id="amount" label="Remuneração mensal integral (empregada CLT)" value={amount} onChange={setAmount} required error={error} />
        <NumberInput id="dependents" label="Número de dependentes" value={dependents} onChange={setDependents} min={0} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={extended} onChange={(e) => setExtended(e.target.checked)} />
          Empresa participa do Programa Empresa Cidadã (180 dias)
        </label>
        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Calcular
        </button>
      </form>
      <div ref={resultRef} className="calc-result scroll-mt-20">
        {result && <CalculationBreakdown result={result} headline={{ label: 'Total líquido do benefício' }} />}
      </div>
      <Disclaimer />
    </div>
  );
}
