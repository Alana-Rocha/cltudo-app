'use client';

import { usePersistedState } from '@/hooks/usePersistedState';
import { useLiveCalculation } from '@/hooks/useLiveCalculation';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Select } from '@/components/ui/Select';
import { CalculationBreakdown } from '@/components/shared/CalculationBreakdown';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { calculateUnhealthiness, type UnhealthinessGrade } from '@/engine/unhealthiness';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';
import type { CalculationResult } from '@/engine/types';

function parseBrNumber(input: string): number {
  const value = Number(input.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) ? value : 0;
}

export function UnhealthinessCalculator() {
  const [grade, setGrade] = usePersistedState<UnhealthinessGrade>('calculadora-insalubridade:grade', 'medium');
  const [customBase, setCustomBase] = usePersistedState('calculadora-insalubridade:customBase', '');
  function compute(): CalculationResult | string {
    const rules = getRulesFor(new Date());
    return calculateUnhealthiness(
      { grade, base: customBase ? toCents(parseBrNumber(customBase)) : undefined },
      rules
    );
  }

  const { result, handleSubmit, resultRef } = useLiveCalculation(compute());

  return (
    <div className="calc-layout">
      <form onSubmit={handleSubmit} noValidate className="card space-y-4 p-6">
        <Select<UnhealthinessGrade>
          id="grade"
          label="Grau de insalubridade"
          value={grade}
          onChange={setGrade}
          options={[
            { value: 'low', label: 'Mínimo (10%)' },
            { value: 'medium', label: 'Médio (20%)' },
            { value: 'high', label: 'Máximo (40%)' },
          ]}
        />
        <CurrencyInput id="base" label="Base de cálculo (opcional — padrão: salário mínimo)" value={customBase} onChange={setCustomBase} />
        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Calcular
        </button>
      </form>
      <div ref={resultRef} className="calc-result scroll-mt-20">
        {result && <CalculationBreakdown result={result} headline={{ label: 'Adicional de insalubridade (mensal)' }} />}
      </div>
      <Disclaimer />
    </div>
  );
}
