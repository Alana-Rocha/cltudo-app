'use client';

import { usePersistedState } from '@/hooks/usePersistedState';
import { useLiveCalculation, type FieldError } from '@/hooks/useLiveCalculation';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { NumberInput } from '@/components/ui/NumberInput';
import { CalculationBreakdown } from '@/components/shared/CalculationBreakdown';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { calculateVacation } from '@/engine/vacation';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';
import type { CalculationResult } from '@/engine/types';

function parseBrNumber(input: string): number {
  const value = Number(input.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) ? value : 0;
}

export function VacationCalculator() {
  const [gross, setGross] = usePersistedState('calculadora-ferias:gross', '');
  const [averageVariables, setAverageVariables] = usePersistedState('calculadora-ferias:averageVariables', '');
  const [daysTaken, setDaysTaken] = usePersistedState('calculadora-ferias:daysTaken', '30');
  const [daysSold, setDaysSold] = usePersistedState('calculadora-ferias:daysSold', '0');
  const [dependents, setDependents] = usePersistedState('calculadora-ferias:dependents', '0');
  function compute(): CalculationResult | FieldError {
    const rules = getRulesFor(new Date());
    const grossCents = toCents(parseBrNumber(gross));
    const taken = Number(daysTaken) || 0;
    const sold = Number(daysSold) || 0;
    const maxSold = Math.floor(30 * rules.vacation.maxSoldFraction);
    if (grossCents <= 0) return { field: 'gross', message: 'Informe um salário bruto maior que zero.' };
    if (sold > maxSold) return { field: 'sold', message: `É possível vender no máximo ${maxSold} dias.` };
    if (taken + sold > 30) return { field: 'sold', message: 'Dias gozados + dias vendidos não pode ultrapassar 30.' };
    return calculateVacation(
      {
        grossSalary: grossCents,
        averageVariables: averageVariables ? toCents(parseBrNumber(averageVariables)) : undefined,
        daysTaken: taken,
        daysSold: sold,
        dependents: Number(dependents) || 0,
      },
      rules
    );
  }

  const { result, errorFor, handleSubmit, resultRef } = useLiveCalculation(compute());

  return (
    <div className="calc-layout">
      <form onSubmit={handleSubmit} noValidate className="card space-y-4 p-6">
        <CurrencyInput id="gross" label="Salário bruto" value={gross} onChange={setGross} required error={errorFor('gross')} />
        <CurrencyInput
          id="averageVariables"
          label="Média mensal de variáveis habituais (opcional)"
          value={averageVariables}
          onChange={setAverageVariables}
          hint="Horas extras, comissões e adicionais recebidos com frequência no período aquisitivo."
        />
        <NumberInput id="taken" label="Dias de férias a gozar" value={daysTaken} onChange={setDaysTaken} min={1} max={30} />
        <NumberInput id="sold" label="Dias de abono (venda)" value={daysSold} onChange={setDaysSold} min={0} max={10} hint="Até 10 de 30 dias" error={errorFor('sold')} />
        <NumberInput id="dependents" label="Número de dependentes" value={dependents} onChange={setDependents} min={0} />
        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Calcular
        </button>
      </form>
      <div ref={resultRef} className="calc-result scroll-mt-20">
        {result && <CalculationBreakdown result={result} headline={{ label: 'Valor líquido das férias' }} />}
      </div>
      <Disclaimer />
    </div>
  );
}
