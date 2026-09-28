'use client';

import { usePersistedState } from '@/hooks/usePersistedState';
import { useLiveCalculation } from '@/hooks/useLiveCalculation';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { NumberInput } from '@/components/ui/NumberInput';
import { CalculationBreakdown } from '@/components/shared/CalculationBreakdown';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { calculateThirteenth } from '@/engine/thirteenth';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';
import type { CalculationResult } from '@/engine/types';

function parseBrNumber(input: string): number {
  const value = Number(input.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) ? value : 0;
}

export function ThirteenthCalculator() {
  const [gross, setGross] = usePersistedState('calculadora-13-salario:gross', '');
  const [averageVariables, setAverageVariables] = usePersistedState('calculadora-13-salario:averageVariables', '');
  const [months, setMonths] = usePersistedState('calculadora-13-salario:months', '12');
  const [dependents, setDependents] = usePersistedState('calculadora-13-salario:dependents', '0');
  function compute(): CalculationResult | string {
    const grossCents = toCents(parseBrNumber(gross));
    if (grossCents <= 0) return 'Informe um salário bruto maior que zero.';
    const rules = getRulesFor(new Date());
    return calculateThirteenth(
      {
        grossSalary: grossCents,
        averageVariables: averageVariables ? toCents(parseBrNumber(averageVariables)) : undefined,
        monthsWorked: Number(months) || 0,
        dependents: Number(dependents) || 0,
      },
      rules
    );
  }

  const { result, error, handleSubmit, resultRef } = useLiveCalculation(compute());

  return (
    <div className="calc-layout">
      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <CurrencyInput id="gross" label="Salário bruto" value={gross} onChange={setGross} required error={error} />
        <CurrencyInput
          id="averageVariables"
          label="Média mensal de variáveis habituais (opcional)"
          value={averageVariables}
          onChange={setAverageVariables}
          hint="Horas extras, comissões e adicionais recebidos com frequência no ano."
        />
        <NumberInput id="months" label="Meses trabalhados no ano" value={months} onChange={setMonths} min={0} max={12} hint="Conte 1 mês para cada 15 dias ou mais trabalhados" />
        <NumberInput id="dependents" label="Número de dependentes" value={dependents} onChange={setDependents} min={0} />
        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Calcular
        </button>
      </form>
      <div ref={resultRef} className="calc-result scroll-mt-20">
        {result && <CalculationBreakdown result={result} headline={{ label: '13º líquido (1ª + 2ª parcela)' }} />}
      </div>
      <Disclaimer />
    </div>
  );
}
