'use client';

import { useState } from 'react';
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
  const [income, setIncome] = useState('');
  const [dependents, setDependents] = useState('0');
  const [alimony, setAlimony] = useState('');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const incomeCents = toCents(parseBrNumber(income));
    if (incomeCents <= 0) return setError('Informe um rendimento maior que zero.');
    setError(null);
    const rules = getRulesFor(new Date());
    const inss = calculateInss(incomeCents, rules);
    setResult(
      calculateIrrfStandalone(
        {
          taxableIncome: incomeCents,
          inss: inss.total,
          dependents: Number(dependents) || 0,
          alimony: alimony ? toCents(parseBrNumber(alimony)) : undefined,
        },
        rules
      )
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
        <CurrencyInput id="income" label="Rendimento tributável (mensal)" value={income} onChange={setIncome} required error={error ?? undefined} />
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
      {result && <CalculationBreakdown result={result} />}
      <Disclaimer />
    </div>
  );
}
