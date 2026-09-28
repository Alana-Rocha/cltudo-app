'use client';

import { usePersistedState } from '@/hooks/usePersistedState';
import { useLiveCalculation } from '@/hooks/useLiveCalculation';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { NumberInput } from '@/components/ui/NumberInput';
import { CalculationBreakdown } from '@/components/shared/CalculationBreakdown';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { calculateUnemploymentInsurance } from '@/engine/unemploymentInsurance';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';
import type { CalculationResult } from '@/engine/types';

function parseBrNumber(input: string): number {
  const value = Number(input.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) ? value : 0;
}

export function UnemploymentInsuranceCalculator() {
  const [s1, setS1] = usePersistedState('calculadora-seguro-desemprego:s1', '');
  const [s2, setS2] = usePersistedState('calculadora-seguro-desemprego:s2', '');
  const [s3, setS3] = usePersistedState('calculadora-seguro-desemprego:s3', '');
  const [requestNumber, setRequestNumber] = usePersistedState('calculadora-seguro-desemprego:requestNumber', '1');
  const [monthsWorked, setMonthsWorked] = usePersistedState('calculadora-seguro-desemprego:monthsWorked', '12');
  function compute(): CalculationResult | string {
    const c1 = toCents(parseBrNumber(s1));
    const c2 = toCents(parseBrNumber(s2));
    const c3 = toCents(parseBrNumber(s3));
    if (c1 <= 0 || c2 <= 0 || c3 <= 0) return 'Informe os 3 últimos salários, todos maiores que zero.';
    return calculateUnemploymentInsurance(
      { lastThreeSalaries: [c1, c2, c3], requestNumber: Number(requestNumber) || 1, monthsWorkedInPeriod: Number(monthsWorked) || 0 },
      getRulesFor(new Date())
    );
  }

  const { result, error, handleSubmit, resultRef } = useLiveCalculation(compute());

  return (
    <div className="calc-layout">
      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <div className="grid grid-cols-3 gap-4">
          <CurrencyInput id="s1" label="Salário 1" value={s1} onChange={setS1} required error={error} />
          <CurrencyInput id="s2" label="Salário 2" value={s2} onChange={setS2} />
          <CurrencyInput id="s3" label="Salário 3" value={s3} onChange={setS3} />
        </div>
        <div>
          <label htmlFor="requestNumber" className="mb-1 block text-sm font-medium">
            Número da solicitação
          </label>
          <select id="requestNumber" value={requestNumber} onChange={(e) => setRequestNumber(e.target.value)} className="w-full rounded-md border px-3 py-2">
            <option value="1">1ª solicitação</option>
            <option value="2">2ª solicitação</option>
            <option value="3">3ª solicitação ou mais</option>
          </select>
        </div>
        <NumberInput id="monthsWorked" label="Meses trabalhados no período exigido" value={monthsWorked} onChange={setMonthsWorked} min={0} />
        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Calcular
        </button>
      </form>
      <div ref={resultRef} className="calc-result scroll-mt-20">
        {result && <CalculationBreakdown result={result} headline={{ label: 'Total do seguro-desemprego' }} />}
      </div>
      <Disclaimer />
    </div>
  );
}
