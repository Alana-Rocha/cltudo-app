'use client';

import { usePersistedState } from '@/hooks/usePersistedState';
import { useLiveCalculation } from '@/hooks/useLiveCalculation';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Select } from '@/components/ui/Select';
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
    <div className="calc-layout">
      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <CurrencyInput id="salary" label="Salário bruto do funcionário" value={salary} onChange={setSalary} required error={error} />

        <Select<EmployerRegime>
          id="regime"
          label="Regime tributário da empresa"
          value={regime}
          onChange={setRegime}
          options={[
            { value: 'simples', label: 'Simples Nacional (Anexos I, II, III ou V)' },
            { value: 'simples_annex_iv', label: 'Simples Nacional — Anexo IV' },
            { value: 'standard', label: 'Lucro Presumido ou Lucro Real' },
          ]}
        />

        {regime !== 'simples' && (
          <Select
            id="rat"
            label="Grau de risco da atividade (RAT)"
            value={ratRate}
            onChange={setRatRate}
            options={rules.employerCosts.ratRates.map((rate, i) => ({
              value: String(rate),
              label: `${['Leve', 'Médio', 'Grave'][i] ?? `Grau ${i + 1}`} (${formatPercent(rate, 0)})`,
            }))}
          />
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
      <div ref={resultRef} className="calc-result scroll-mt-20">
        {result && <CalculationBreakdown result={result} headline={{ label: 'Custo mensal para a empresa' }} />}
      </div>
      <Disclaimer />
    </div>
  );
}
