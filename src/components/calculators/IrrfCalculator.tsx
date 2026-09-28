'use client';

import { usePersistedState } from '@/hooks/usePersistedState';
import { useLiveCalculation } from '@/hooks/useLiveCalculation';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { NumberInput } from '@/components/ui/NumberInput';
import { CalculationBreakdown } from '@/components/shared/CalculationBreakdown';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { calculateIrrfStandalone } from '@/engine/irrf';
import { calculateInss } from '@/engine/inss';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';
import type { CalculationResult } from '@/engine/types';

function parseBrNumber(input: string): number {
  const value = Number(input.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) ? value : 0;
}

export function IrrfCalculator() {
  const [income, setIncome] = usePersistedState('calculadora-irrf:income', '');
  const [dependents, setDependents] = usePersistedState('calculadora-irrf:dependents', '0');
  const [alimony, setAlimony] = usePersistedState('calculadora-irrf:alimony', '');

  function compute(): CalculationResult | string {
    const incomeCents = toCents(parseBrNumber(income));
    if (incomeCents <= 0) return 'Informe um rendimento maior que zero.';
    const rules = getRulesFor(new Date());
    const inss = calculateInss(incomeCents, rules);
    return calculateIrrfStandalone(
      {
        taxableIncome: incomeCents,
        inss: inss.total,
        dependents: Number(dependents) || 0,
        alimony: alimony ? toCents(parseBrNumber(alimony)) : undefined,
      },
      rules
    );
  }

  const { result, error, handleSubmit, resultRef } = useLiveCalculation(compute());

  return (
    <div className="calc-layout">
      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <CurrencyInput id="income" label="Rendimento tributável (mensal)" value={income} onChange={setIncome} required error={error} />
        <NumberInput id="dependents" label="Número de dependentes" value={dependents} onChange={setDependents} min={0} />
        <CurrencyInput id="alimony" label="Pensão alimentícia (opcional)" value={alimony} onChange={setAlimony} />
        <p className="text-xs text-gray-400">
          O INSS sobre este rendimento é calculado automaticamente e usado como uma das deduções
          legais possíveis.
        </p>
        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Calcular
        </button>
      </form>
      <div ref={resultRef} className="calc-result scroll-mt-20">
        {result && <CalculationBreakdown result={result} headline={{ label: 'IRRF retido na fonte', field: 'deductions' }} />}
      </div>
      <Disclaimer />
    </div>
  );
}
