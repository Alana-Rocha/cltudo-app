'use client';

import { usePersistedState } from '@/hooks/usePersistedState';
import { useLiveCalculation } from '@/hooks/useLiveCalculation';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { NumberInput } from '@/components/ui/NumberInput';
import { CalculationBreakdown } from '@/components/shared/CalculationBreakdown';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { calculateOvertime } from '@/engine/overtime';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';
import type { CalculationResult } from '@/engine/types';

function parseBrNumber(input: string): number {
  const value = Number(input.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) ? value : 0;
}

export function OvertimeCalculator() {
  const [gross, setGross] = usePersistedState('calculadora-hora-extra:gross', '');
  const [monthlyHours, setMonthlyHours] = usePersistedState('calculadora-hora-extra:monthlyHours', '220');
  const [hours50, setHours50] = usePersistedState('calculadora-hora-extra:hours50', '0');
  const [hours100, setHours100] = usePersistedState('calculadora-hora-extra:hours100', '0');
  const [workingDays, setWorkingDays] = usePersistedState('calculadora-hora-extra:workingDays', '22');
  const [sundaysHolidays, setSundaysHolidays] = usePersistedState('calculadora-hora-extra:sundaysHolidays', '4');
  function compute(): CalculationResult | string {
    const grossCents = toCents(parseBrNumber(gross));
    if (grossCents <= 0) return 'Informe um salário bruto maior que zero.';
    const rules = getRulesFor(new Date());
    return calculateOvertime(
      {
        grossSalary: grossCents,
        monthlyHours: Number(monthlyHours) || rules.overtime.defaultMonthlyHours,
        lines: [
          { hours: Number(hours50) || 0, rate: 0.5 },
          { hours: Number(hours100) || 0, rate: 1.0 },
        ].filter((l) => l.hours > 0),
        workingDaysInMonth: Number(workingDays) || 22,
        sundaysAndHolidaysInMonth: Number(sundaysHolidays) || 0,
      },
      rules
    );
  }

  const { result, error, handleSubmit, resultRef } = useLiveCalculation(compute());

  return (
    <div className="calc-layout">
      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <CurrencyInput id="gross" label="Salário bruto" value={gross} onChange={setGross} required error={error} />
        <NumberInput id="monthlyHours" label="Jornada mensal (horas)" value={monthlyHours} onChange={setMonthlyHours} min={1} hint="Padrão: 220h" />
        <div className="grid grid-cols-2 gap-4">
          <NumberInput id="hours50" label="Horas extras a 50%" value={hours50} onChange={setHours50} min={0} />
          <NumberInput id="hours100" label="Horas extras a 100%" value={hours100} onChange={setHours100} min={0} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <NumberInput id="workingDays" label="Dias úteis no mês" value={workingDays} onChange={setWorkingDays} min={1} max={31} />
          <NumberInput id="sundaysHolidays" label="Domingos + feriados no mês" value={sundaysHolidays} onChange={setSundaysHolidays} min={0} max={10} />
        </div>
        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Calcular
        </button>
      </form>
      <div ref={resultRef} className="calc-result scroll-mt-20">
        {result && <CalculationBreakdown result={result} headline={{ label: 'Horas extras + DSR' }} />}
      </div>
      <Disclaimer />
    </div>
  );
}
