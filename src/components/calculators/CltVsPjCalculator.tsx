'use client';

import { usePersistedState } from '@/hooks/usePersistedState';
import { useLiveCalculation, type FieldError } from '@/hooks/useLiveCalculation';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { NumberInput } from '@/components/ui/NumberInput';
import { CalculationBreakdown } from '@/components/shared/CalculationBreakdown';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { calculateCltVsPj } from '@/engine/cltVsPj';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';
import { formatCurrency } from '@/lib/format';
import type { CalculationResult } from '@/engine/types';

function parseBrNumber(input: string): number {
  const value = Number(input.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) ? value : 0;
}

function Comparison({ result }: { result: CalculationResult }) {
  const monthly = (key: string) => Math.round((result.items.find((i) => i.key === key)?.amount ?? 0) / 12);
  const pjWins = result.totals.net > 0;
  const tile = (label: string, value: number, wins: boolean) => (
    <div className={`rounded-lg border p-3 ${wins ? 'border-brand-500' : ''}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{formatCurrency(value)}</p>
      <p className="text-xs text-gray-500">por mês, em média</p>
    </div>
  );
  if (!result.items.some((i) => i.key === 'pj-total')) return null;
  return (
    <div className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-3 text-left">
      {tile('CLT', monthly('clt-total'), !pjWins)}
      {tile('PJ', monthly('pj-total'), pjWins)}
    </div>
  );
}

export function CltVsPjCalculator() {
  const [cltGross, setCltGross] = usePersistedState('calculadora-clt-x-pj:cltGross', '');
  const [benefits, setBenefits] = usePersistedState('calculadora-clt-x-pj:benefits', '');
  const [revenue, setRevenue] = usePersistedState('calculadora-clt-x-pj:revenue', '');
  const [costs, setCosts] = usePersistedState('calculadora-clt-x-pj:costs', '');
  const [dependents, setDependents] = usePersistedState('calculadora-clt-x-pj:dependents', '0');

  function compute(): CalculationResult | FieldError {
    const cltCents = toCents(parseBrNumber(cltGross));
    const revenueCents = toCents(parseBrNumber(revenue));
    if (cltCents <= 0) return { field: 'cltGross', message: 'Informe o salário bruto da proposta CLT.' };
    if (revenueCents <= 0) return { field: 'revenue', message: 'Informe o faturamento mensal da proposta PJ.' };
    return calculateCltVsPj(
      {
        cltGross: cltCents,
        dependents: Number(dependents) || 0,
        cltMonthlyBenefits: benefits ? toCents(parseBrNumber(benefits)) : undefined,
        pjMonthlyRevenue: revenueCents,
        pjMonthlyCosts: costs ? toCents(parseBrNumber(costs)) : undefined,
      },
      getRulesFor(new Date())
    );
  }

  const { result, errorFor, handleSubmit, resultRef } = useLiveCalculation(compute());
  const pjWins = (result?.totals.net ?? 0) > 0;

  return (
    <div className="calc-layout">
      <form onSubmit={handleSubmit} noValidate className="card space-y-4 p-6">
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold">Proposta CLT</legend>
          <CurrencyInput id="cltGross" label="Salário bruto mensal" value={cltGross} onChange={setCltGross} required error={errorFor('cltGross')} />
          <CurrencyInput
            id="benefits"
            label="Benefícios mensais (opcional)"
            value={benefits}
            onChange={setBenefits}
            hint="VR, VA, plano de saúde — o que a empresa paga e você perderia como PJ."
          />
        </fieldset>

        <fieldset className="space-y-4 border-t pt-4">
          <legend className="text-sm font-semibold">Proposta PJ</legend>
          <CurrencyInput id="revenue" label="Faturamento mensal" value={revenue} onChange={setRevenue} required error={errorFor('revenue')} />
          <CurrencyInput
            id="costs"
            label="Custos mensais da empresa (opcional)"
            value={costs}
            onChange={setCosts}
            hint="Contador, certificado digital, taxas. Costuma ficar entre R$ 200 e R$ 500."
          />
        </fieldset>

        <NumberInput id="dependents" label="Número de dependentes" value={dependents} onChange={setDependents} min={0} />

        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Comparar
        </button>
      </form>
      <div ref={resultRef} className="calc-result scroll-mt-20">
        {result && (
          <CalculationBreakdown
            result={result}
            headline={{ label: pjWins ? 'Como PJ, você ganha a mais por ano' : 'Como CLT, você ganha a mais por ano', absolute: true }}
            summary={<Comparison result={result} />}
          />
        )}
      </div>
      <Disclaimer />
    </div>
  );
}
