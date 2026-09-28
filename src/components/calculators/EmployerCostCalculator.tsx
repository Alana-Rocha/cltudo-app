'use client';

import { usePersistedState } from '@/hooks/usePersistedState';
import { useLiveCalculation } from '@/hooks/useLiveCalculation';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { CalculationBreakdown } from '@/components/shared/CalculationBreakdown';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { calculateEmployerCost, type EmployerRegime } from '@/engine/employerCost';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';
import { formatPercent } from '@/lib/format';
import type { CalculationResult } from '@/engine/types';

function parseBrNumber(input: string): number {
  const value = Number(input.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) ? value : 0;
}

export function EmployerCostCalculator() {
  const rules = getRulesFor(new Date());
  const [salary, setSalary] = usePersistedState('calculadora-custo-funcionario:salary', '');
  const [regime, setRegime] = usePersistedState<EmployerRegime>('calculadora-custo-funcionario:regime', 'simples');
  const [ratRate, setRatRate] = usePersistedState('calculadora-custo-funcionario:ratRate', '0.02');
  const [benefits, setBenefits] = usePersistedState('calculadora-custo-funcionario:benefits', '');
  const [transport, setTransport] = usePersistedState('calculadora-custo-funcionario:transport', '');

  function compute(): CalculationResult | string {
    const cents = toCents(parseBrNumber(salary));
    if (cents <= 0) return 'Informe um salário bruto maior que zero.';
    return calculateEmployerCost(
      {
        grossSalary: cents,
        regime,
        ratRate: Number(ratRate) || 0,
        monthlyBenefits: benefits ? toCents(parseBrNumber(benefits)) : undefined,
        transportVoucherCost: transport ? toCents(parseBrNumber(transport)) : undefined,
      },
      rules
    );
  }

  const { result, error, handleSubmit, resultRef } = useLiveCalculation(compute());

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
        <CurrencyInput id="salary" label="Salário bruto do funcionário" value={salary} onChange={setSalary} required error={error} />

        <div>
          <label htmlFor="regime" className="mb-1 block text-sm font-medium">
            Regime tributário da empresa
          </label>
          <select id="regime" value={regime} onChange={(e) => setRegime(e.target.value as EmployerRegime)} className="w-full rounded-md border px-3 py-2">
            <option value="simples">Simples Nacional (Anexos I, II, III ou V)</option>
            <option value="simples_annex_iv">Simples Nacional — Anexo IV</option>
            <option value="standard">Lucro Presumido ou Lucro Real</option>
          </select>
        </div>

        {regime !== 'simples' && (
          <div>
            <label htmlFor="rat" className="mb-1 block text-sm font-medium">
              Grau de risco da atividade (RAT)
            </label>
            <select id="rat" value={ratRate} onChange={(e) => setRatRate(e.target.value)} className="w-full rounded-md border px-3 py-2">
              {rules.employerCosts.ratRates.map((rate, i) => (
                <option key={rate} value={String(rate)}>
                  {['Leve', 'Médio', 'Grave'][i] ?? `Grau ${i + 1}`} ({formatPercent(rate, 0)})
                </option>
              ))}
            </select>
          </div>
        )}

        <CurrencyInput
          id="benefits"
          label="Benefícios mensais (opcional)"
          value={benefits}
          onChange={setBenefits}
          hint="VR, VA, plano de saúde e outros benefícios pagos pela empresa."
        />
        <CurrencyInput
          id="transport"
          label="Custo mensal do vale-transporte (opcional)"
          value={transport}
          onChange={setTransport}
          hint="Valor total das passagens no mês. A empresa paga o que passar de 6% do salário."
        />

        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Calcular
        </button>
      </form>
      <div ref={resultRef} className="scroll-mt-20">
        {result && <CalculationBreakdown result={result} headline={{ label: 'Custo mensal para a empresa' }} />}
      </div>
      <Disclaimer />
    </div>
  );
}
