'use client';

import { useState } from 'react';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
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
  const [grade, setGrade] = useState<UnhealthinessGrade>('medium');
  const [customBase, setCustomBase] = useState('');
  const [result, setResult] = useState<CalculationResult | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const rules = getRulesFor(new Date());
    setResult(
      calculateUnhealthiness(
        { grade, base: customBase ? toCents(parseBrNumber(customBase)) : undefined },
        rules
      )
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
        <div>
          <label htmlFor="grade" className="mb-1 block text-sm font-medium">
            Grau de insalubridade
          </label>
          <select id="grade" value={grade} onChange={(e) => setGrade(e.target.value as UnhealthinessGrade)} className="w-full rounded-md border px-3 py-2">
            <option value="low">Mínimo (10%)</option>
            <option value="medium">Médio (20%)</option>
            <option value="high">Máximo (40%)</option>
          </select>
        </div>
        <CurrencyInput id="base" label="Base de cálculo (opcional — padrão: salário mínimo)" value={customBase} onChange={setCustomBase} />
        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Calcular
        </button>
      </form>
      {result && <CalculationBreakdown result={result} />}
      <Disclaimer />
    </div>
  );
}
