'use client';

import { usePersistedState } from '@/hooks/usePersistedState';
import { useLiveCalculation } from '@/hooks/useLiveCalculation';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Checkbox } from '@/components/ui/Checkbox';
import { NumberInput } from '@/components/ui/NumberInput';
import { CalculationBreakdown } from '@/components/shared/CalculationBreakdown';
import { SalaryCompositionBar } from '@/components/shared/SalaryCompositionBar';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { calculateSalary } from '@/engine/salary';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';
import type { CalculationResult } from '@/engine/types';

function parseBrNumber(input: string): number {
  const normalized = input.replace(/\./g, '').replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}

export function SalaryCalculator() {
  const [gross, setGross] = usePersistedState('calculadora-salario-liquido:gross', '');
  const [dependents, setDependents] = usePersistedState('calculadora-salario-liquido:dependents', '0');
  const [showMore, setShowMore] = usePersistedState('calculadora-salario-liquido:showMore', false);
  const [alimony, setAlimony] = usePersistedState('calculadora-salario-liquido:alimony', '');
  const [hasVt, setHasVt] = usePersistedState('calculadora-salario-liquido:hasVt', false);
  const [vtValue, setVtValue] = usePersistedState('calculadora-salario-liquido:vtValue', '');
  const [vtTrips, setVtTrips] = usePersistedState('calculadora-salario-liquido:vtTrips', '2');
  const [vtDays, setVtDays] = usePersistedState('calculadora-salario-liquido:vtDays', '22');
  const vtMonthlyTotal = (() => {
    const price = parseBrNumber(vtValue);
    const trips = Number(vtTrips) || 0;
    const days = Number(vtDays) || 0;
    return price * trips * days;
  })();

  function compute(): CalculationResult | string {
    const grossCents = toCents(parseBrNumber(gross));
    if (grossCents <= 0) return 'Informe um salário bruto maior que zero.';
    return calculateSalary(
      {
        grossSalary: grossCents,
        dependents: Number(dependents) || 0,
        alimony: alimony ? toCents(parseBrNumber(alimony)) : undefined,
        hasTransportVoucher: hasVt,
        transportVoucherValue: vtMonthlyTotal > 0 ? toCents(vtMonthlyTotal) : undefined,
      },
      getRulesFor(new Date())
    );
  }

  const { result, error, handleSubmit, resultRef } = useLiveCalculation(compute());

  return (
    <div className="calc-layout">
      <form onSubmit={handleSubmit} noValidate className="card space-y-4 p-6">
        <CurrencyInput id="gross" label="Salário bruto" value={gross} onChange={setGross} required error={error} />
        <NumberInput id="dependents" label="Número de dependentes" value={dependents} onChange={setDependents} min={0} />

        <button
          type="button"
          onClick={() => setShowMore((s) => !s)}
          className="text-sm font-medium text-brand-700 underline"
        >
          Mais opções
        </button>

        {showMore && (
          <div className="space-y-4 border-t pt-4">
            <CurrencyInput id="alimony" label="Pensão alimentícia (opcional)" value={alimony} onChange={setAlimony} />
            <Checkbox checked={hasVt} onChange={setHasVt}>
              Recebo vale-transporte
            </Checkbox>
            {hasVt && (
              <div className="space-y-3">
                <CurrencyInput id="vt" label="Valor da passagem (por trecho)" value={vtValue} onChange={setVtValue} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <NumberInput id="vtTrips" label="Viagens por dia" value={vtTrips} onChange={setVtTrips} min={1} max={10} />
                  <NumberInput id="vtDays" label="Dias trabalhados no mês" value={vtDays} onChange={setVtDays} min={1} max={31} />
                </div>
                <p className="text-xs text-gray-400">
                  {vtMonthlyTotal > 0
                    ? `Total mensal estimado: R$ ${vtMonthlyTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${vtTrips} viagens × ${vtDays} dias)`
                    : 'Informe o valor da passagem para calcular o total mensal'}
                </p>
              </div>
            )}
          </div>
        )}

        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Calcular
        </button>
      </form>

      <div ref={resultRef} className="calc-result scroll-mt-20">
        {result && (
          <CalculationBreakdown
            result={result}
            headline={{ label: 'Salário líquido' }}
            summary={<SalaryCompositionBar result={result} />}
          />
        )}
      </div>
      <Disclaimer />
    </div>
  );
}
