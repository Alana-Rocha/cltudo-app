'use client';

import { usePersistedState } from '@/hooks/usePersistedState';
import { useLiveCalculation, type FieldError } from '@/hooks/useLiveCalculation';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { NumberInput } from '@/components/ui/NumberInput';
import { CalculationBreakdown } from '@/components/shared/CalculationBreakdown';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { calculateRaise } from '@/engine/raise';
import { getRulesFor } from '@/rules';
import { multiply, toCents } from '@/lib/money';
import type { CalculationResult } from '@/engine/types';

function parseBrNumber(input: string): number {
  const value = Number(input.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) ? value : 0;
}

type RaiseMode = 'percent' | 'amount' | 'newSalary';

export function RaiseCalculator() {
  const [current, setCurrent] = usePersistedState('calculadora-aumento-salarial:current', '');
  const [mode, setMode] = usePersistedState<RaiseMode>('calculadora-aumento-salarial:mode', 'percent');
  const [percent, setPercent] = usePersistedState('calculadora-aumento-salarial:percent', '10');
  const [amount, setAmount] = usePersistedState('calculadora-aumento-salarial:amount', '');
  const [newSalary, setNewSalary] = usePersistedState('calculadora-aumento-salarial:newSalary', '');
  const [dependents, setDependents] = usePersistedState('calculadora-aumento-salarial:dependents', '0');

  function compute(): CalculationResult | FieldError {
    const currentCents = toCents(parseBrNumber(current));
    if (currentCents <= 0) return { field: 'current', message: 'Informe o salário bruto atual.' };

    const newCents =
      mode === 'percent'
        ? currentCents + multiply(currentCents, (Number(percent.replace(',', '.')) || 0) / 100)
        : mode === 'amount'
          ? currentCents + toCents(parseBrNumber(amount))
          : toCents(parseBrNumber(newSalary));
    if (newCents <= currentCents) return { field: mode, message: 'O novo salário precisa ser maior que o atual.' };

    return calculateRaise(
      { currentGross: currentCents, newGross: newCents, dependents: Number(dependents) || 0 },
      getRulesFor(new Date())
    );
  }

  const { result, errorFor, handleSubmit, resultRef } = useLiveCalculation(compute());

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
        <CurrencyInput id="current" label="Salário bruto atual" value={current} onChange={setCurrent} required error={errorFor('current')} />

        <div>
          <label htmlFor="mode" className="mb-1 block text-sm font-medium">
            Como você quer informar o aumento?
          </label>
          <select id="mode" value={mode} onChange={(e) => setMode(e.target.value as RaiseMode)} className="w-full rounded-md border px-3 py-2">
            <option value="percent">Percentual (%)</option>
            <option value="amount">Valor em reais a mais</option>
            <option value="newSalary">Novo salário bruto</option>
          </select>
        </div>

        {mode === 'percent' && (
          <NumberInput id="percent" label="Aumento (%)" value={percent} onChange={setPercent} min={0} error={errorFor('percent')} />
        )}
        {mode === 'amount' && (
          <CurrencyInput id="amount" label="Aumento bruto (R$)" value={amount} onChange={setAmount} error={errorFor('amount')} />
        )}
        {mode === 'newSalary' && (
          <CurrencyInput id="newSalary" label="Novo salário bruto" value={newSalary} onChange={setNewSalary} error={errorFor('newSalary')} />
        )}

        <NumberInput id="dependents" label="Número de dependentes" value={dependents} onChange={setDependents} min={0} />

        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Calcular
        </button>
      </form>
      <div ref={resultRef} className="scroll-mt-20">
        {result && <CalculationBreakdown result={result} headline={{ label: 'Aumento líquido por mês' }} />}
      </div>
      <Disclaimer />
    </div>
  );
}
