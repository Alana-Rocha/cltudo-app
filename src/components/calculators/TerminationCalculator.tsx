'use client';

import { useLiveCalculation } from '@/hooks/useLiveCalculation';
import { CalculationBreakdown } from '@/components/shared/CalculationBreakdown';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { useTerminationForm } from './useTerminationForm';

export function TerminationCalculator() {
  const form = useTerminationForm('calculadora-rescisao');
  const { result, errorFor, handleSubmit, resultRef } = useLiveCalculation(form.outcome);

  return (
    <div className="calc-layout">
      <form onSubmit={handleSubmit} noValidate className="card space-y-4 p-6">
        {form.renderFields(errorFor)}

        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Calcular
        </button>
      </form>
      <div ref={resultRef} className="calc-result scroll-mt-20">
        {result && <CalculationBreakdown result={result} headline={{ label: 'Total líquido da rescisão' }} />}
      </div>
      <Disclaimer />
    </div>
  );
}
