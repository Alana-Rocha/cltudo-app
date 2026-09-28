'use client';

import { usePersistedState } from '@/hooks/usePersistedState';
import { useLiveCalculation, type FieldError } from '@/hooks/useLiveCalculation';
import { NumberInput } from '@/components/ui/NumberInput';
import { Select } from '@/components/ui/Select';
import { DateInput } from '@/components/ui/DateInput';
import { CalculationBreakdown } from '@/components/shared/CalculationBreakdown';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { calculateNoticeStandalone } from '@/engine/notice';
import { earliestRulesDate, getRulesFor, hasRulesFor } from '@/rules';
import { parseBrDate } from '@/lib/dates';
import type { CalculationResult } from '@/engine/types';

export function NoticeCalculator() {
  const [admissionDate, setAdmissionDate] = usePersistedState('calculadora-aviso-previo:admissionDate', '');
  const [referenceDate, setReferenceDate] = usePersistedState('calculadora-aviso-previo:referenceDate', '');
  const [reason, setReason] = usePersistedState<'without_cause' | 'employee_resignation'>('calculadora-aviso-previo:reason', 'without_cause');
  function compute(): CalculationResult | FieldError {
    const admission = parseBrDate(admissionDate);
    const reference = parseBrDate(referenceDate);
    if (!admission) return { field: 'admission', message: 'Informe a data de admissão no formato dd/mm/aaaa.' };
    if (!reference) return { field: 'reference', message: 'Informe a data de desligamento no formato dd/mm/aaaa.' };
    if (reference.getTime() <= admission.getTime())
      return { field: 'reference', message: 'A data de desligamento deve ser depois da admissão.' };
    // Aviso prévio rules (Lei 12.506/2011) predate every rule set, so older dates can use the earliest one.
    const rules = getRulesFor(hasRulesFor(reference) ? reference : earliestRulesDate());
    return calculateNoticeStandalone(admission, reference, reason, rules);
  }

  const { result, errorFor, handleSubmit, resultRef } = useLiveCalculation(compute());

  return (
    <div className="calc-layout">
      <form onSubmit={handleSubmit} noValidate className="card space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <DateInput id="admission" label="Data de admissão" value={admissionDate} onChange={setAdmissionDate} error={errorFor('admission')} />
          <DateInput id="reference" label="Data de desligamento" value={referenceDate} onChange={setReferenceDate} error={errorFor('reference')} />
        </div>
        <Select<typeof reason>
          id="reason"
          label="Motivo"
          value={reason}
          onChange={setReason}
          options={[
            { value: 'without_cause', label: 'Dispensa sem justa causa (pelo empregador)' },
            { value: 'employee_resignation', label: 'Pedido de demissão' },
          ]}
        />
        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Calcular
        </button>
      </form>
      <div ref={resultRef} className="calc-result scroll-mt-20">
        {result && <CalculationBreakdown result={result} headline={{ label: 'Aviso prévio' }} />}
      </div>
      <Disclaimer />
    </div>
  );
}
