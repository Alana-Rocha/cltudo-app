'use client';

import { useState } from 'react';
import { usePersistedState } from '@/hooks/usePersistedState';
import { NumberInput } from '@/components/ui/NumberInput';
import { DateInput } from '@/components/ui/DateInput';
import { CalculationBreakdown } from '@/components/shared/CalculationBreakdown';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { calculateNoticeStandalone } from '@/engine/notice';
import { getRulesFor } from '@/rules';
import { parseBrDate } from '@/lib/dates';
import type { CalculationResult } from '@/engine/types';

export function NoticeCalculator() {
  const [admissionDate, setAdmissionDate] = usePersistedState('calculadora-aviso-previo:admissionDate', '');
  const [referenceDate, setReferenceDate] = usePersistedState('calculadora-aviso-previo:referenceDate', '');
  const [reason, setReason] = usePersistedState<'without_cause' | 'employee_resignation'>('calculadora-aviso-previo:reason', 'without_cause');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const admission = parseBrDate(admissionDate);
    const reference = parseBrDate(referenceDate);
    if (!admission) return setError('Informe a data de admissão no formato dd/mm/aaaa.');
    if (!reference) return setError('Informe a data de referência no formato dd/mm/aaaa.');
    if (reference.getTime() <= admission.getTime())
      return setError('A data de referência deve ser depois da admissão.');
    setError(null);
    const rules = getRulesFor(reference);
    setResult(calculateNoticeStandalone(admission, reference, reason, rules));
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
        <div className="grid grid-cols-2 gap-4">
          <DateInput id="admission" label="Data de admissão" value={admissionDate} onChange={setAdmissionDate} />
          <DateInput id="reference" label="Data de desligamento" value={referenceDate} onChange={setReferenceDate} />
        </div>
        <div>
          <label htmlFor="reason" className="mb-1 block text-sm font-medium">
            Motivo
          </label>
          <select id="reason" value={reason} onChange={(e) => setReason(e.target.value as typeof reason)} className="w-full rounded-md border px-3 py-2">
            <option value="without_cause">Dispensa sem justa causa (pelo empregador)</option>
            <option value="employee_resignation">Pedido de demissão</option>
          </select>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Calcular
        </button>
      </form>
      {result && <CalculationBreakdown result={result} />}
      <Disclaimer />
    </div>
  );
}
