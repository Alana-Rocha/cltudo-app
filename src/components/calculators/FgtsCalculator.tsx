'use client';

import { usePersistedState } from '@/hooks/usePersistedState';
import { useLiveCalculation } from '@/hooks/useLiveCalculation';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { NumberInput } from '@/components/ui/NumberInput';
import { CalculationBreakdown } from '@/components/shared/CalculationBreakdown';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { calculateFgtsStandalone } from '@/engine/fgts';
import type { TerminationType } from '@/engine/fgts';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';
import type { CalculationResult } from '@/engine/types';

function parseBrNumber(input: string): number {
  const value = Number(input.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) ? value : 0;
}

const TERMINATION_TYPES: { value: TerminationType; label: string }[] = [
  { value: 'without_cause', label: 'Sem justa causa (multa 40%)' },
  { value: 'agreement', label: 'Acordo — art. 484-A (multa 20%)' },
  { value: 'employee_resignation', label: 'Pedido de demissão (sem multa)' },
  { value: 'just_cause', label: 'Justa causa (sem multa)' },
  { value: 'contract_end', label: 'Término de contrato (sem multa)' },
];

export function FgtsCalculator() {
  const [salary, setSalary] = usePersistedState('calculadora-fgts:salary', '');
  const [showRescission, setShowRescission] = usePersistedState('calculadora-fgts:showRescission', false);
  const [terminationType, setTerminationType] = usePersistedState<TerminationType>('calculadora-fgts:terminationType', 'without_cause');
  const [months, setMonths] = usePersistedState('calculadora-fgts:months', '12');
  const [actualBalance, setActualBalance] = usePersistedState('calculadora-fgts:actualBalance', '');

  function compute(): CalculationResult | string {
    const salaryCents = toCents(parseBrNumber(salary));
    if (salaryCents <= 0) return 'Informe um salário maior que zero.';
    const rules = getRulesFor(new Date());
    return calculateFgtsStandalone(
      {
        grossSalary: salaryCents,
        rescission: showRescission
          ? {
              terminationType,
              monthsEmployed: Number(months) || 1,
              thirteenthAmount: salaryCents, // aproximação: 13º integral = 1 salário
              vacationTakenAmount: 0,
              noticeIndemnifiedAmount: 0,
              balanceAmount: 0,
              actualBalance: actualBalance ? toCents(parseBrNumber(actualBalance)) : undefined,
            }
          : undefined,
      },
      rules
    );
  }

  const { result, error, handleSubmit, resultRef } = useLiveCalculation(compute());

  return (
    <div className="calc-layout">
      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <CurrencyInput id="salary" label="Salário bruto" value={salary} onChange={setSalary} required error={error} />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showRescission} onChange={(e) => setShowRescission(e.target.checked)} />
          Também quero estimar a multa rescisória
        </label>

        {showRescission && (
          <div className="space-y-4 border-t pt-4">
            <div>
              <label htmlFor="type" className="mb-1 block text-sm font-medium">
                Tipo de desligamento
              </label>
              <select id="type" value={terminationType} onChange={(e) => setTerminationType(e.target.value as TerminationType)} className="w-full rounded-md border px-3 py-2">
                {TERMINATION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <NumberInput id="months" label="Meses de contrato" value={months} onChange={setMonths} min={1} />
            <CurrencyInput id="actualBalance" label="Saldo real do FGTS (opcional, para um valor exato)" value={actualBalance} onChange={setActualBalance} />
          </div>
        )}

        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Calcular
        </button>
      </form>
      <div ref={resultRef} className="calc-result scroll-mt-20">
        {result && <CalculationBreakdown result={result} headline={{ label: 'Depósito mensal do FGTS' }} />}
      </div>
      <Disclaimer />
    </div>
  );
}
