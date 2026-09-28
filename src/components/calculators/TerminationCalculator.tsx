'use client';

import { useEffect } from 'react';
import { usePersistedState } from '@/hooks/usePersistedState';
import { useLiveCalculation, type FieldError } from '@/hooks/useLiveCalculation';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { NumberInput } from '@/components/ui/NumberInput';
import { DateInput } from '@/components/ui/DateInput';
import { CalculationBreakdown } from '@/components/shared/CalculationBreakdown';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { calculateTermination, type NoticeMode } from '@/engine/termination';
import type { TerminationType } from '@/engine/fgts';
import { earliestRulesDate, getRulesFor, hasRulesFor } from '@/rules';
import { toCents } from '@/lib/money';
import { formatBrDate, parseBrDate } from '@/lib/dates';
import type { CalculationResult } from '@/engine/types';

function parseBrNumber(input: string): number {
  const value = Number(input.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) ? value : 0;
}

const TERMINATION_TYPES: { value: TerminationType; label: string }[] = [
  { value: 'without_cause', label: 'Sem justa causa (empregador)' },
  { value: 'employee_resignation', label: 'Pedido de demissão' },
  { value: 'just_cause', label: 'Justa causa' },
  { value: 'agreement', label: 'Acordo (art. 484-A)' },
  { value: 'contract_end', label: 'Término de contrato' },
];

export function TerminationCalculator() {
  const [admissionDate, setAdmissionDate] = usePersistedState('calculadora-rescisao:admissionDate', '');
  const [terminationDate, setTerminationDate] = usePersistedState('calculadora-rescisao:terminationDate', '');
  const [gross, setGross] = usePersistedState('calculadora-rescisao:gross', '');
  const [averageVariables, setAverageVariables] = usePersistedState('calculadora-rescisao:averageVariables', '');
  const [terminationType, setTerminationType] = usePersistedState<TerminationType>('calculadora-rescisao:terminationType', 'without_cause');
  const [noticeMode, setNoticeMode] = usePersistedState<NoticeMode>('calculadora-rescisao:noticeMode', 'indemnified');
  const [daysWorked, setDaysWorked] = usePersistedState('calculadora-rescisao:daysWorked', '30');
  const [daysWorkedTouched, setDaysWorkedTouched] = usePersistedState('calculadora-rescisao:daysWorkedTouched', false);
  const [dependents, setDependents] = usePersistedState('calculadora-rescisao:dependents', '0');
  const [fgtsBalance, setFgtsBalance] = usePersistedState('calculadora-rescisao:fgtsBalance', '');
  const [hasExpiredVacation, setHasExpiredVacation] = usePersistedState('calculadora-rescisao:hasExpiredVacation', false);
  const [expiredVacationTaken, setExpiredVacationTaken] = usePersistedState('calculadora-rescisao:expiredVacationTaken', '0');
  const [expiredVacationOwed, setExpiredVacationOwed] = usePersistedState('calculadora-rescisao:expiredVacationOwed', '0');
  const [expiredVacationOwedTouched, setExpiredVacationOwedTouched] = usePersistedState('calculadora-rescisao:expiredVacationOwedTouched', false);
  const [expiredVacationDoubled, setExpiredVacationDoubled] = usePersistedState('calculadora-rescisao:expiredVacationDoubled', false);

  // "Dias trabalhados no mês do desligamento" é só o pedaço do último mês
  // ainda não pago (saldo de salário) — sugerimos a partir das datas informadas,
  // mas o campo continua editável para casos com faltas não remuneradas.
  useEffect(() => {
    if (daysWorkedTouched) return;
    const admission = parseBrDate(admissionDate);
    const termination = parseBrDate(terminationDate);
    if (!admission || !termination) return;
    const sameMonth =
      admission.getUTCFullYear() === termination.getUTCFullYear() &&
      admission.getUTCMonth() === termination.getUTCMonth();
    const suggested = sameMonth
      ? termination.getUTCDate() - admission.getUTCDate() + 1
      : termination.getUTCDate();
    setDaysWorked(String(Math.max(0, suggested)));
  }, [admissionDate, terminationDate, daysWorkedTouched]);

  // "Dias a receber (vencidos)" sugerido como 30 − dias já gozados, mas
  // editável caso o período vencido não seja de 30 dias.
  useEffect(() => {
    if (expiredVacationOwedTouched) return;
    const taken = Number(expiredVacationTaken) || 0;
    setExpiredVacationOwed(String(Math.max(0, Math.min(30, 30 - taken))));
  }, [expiredVacationTaken, expiredVacationOwedTouched]);

  function compute(): CalculationResult | FieldError {
    const admission = parseBrDate(admissionDate);
    const termination = parseBrDate(terminationDate);
    const grossCents = toCents(parseBrNumber(gross));

    if (!admission) return { field: 'admission', message: 'Informe a data de admissão no formato dd/mm/aaaa.' };
    if (!termination) return { field: 'termination', message: 'Informe a data de desligamento no formato dd/mm/aaaa.' };
    if (termination.getTime() <= admission.getTime())
      return { field: 'termination', message: 'A data de desligamento deve ser depois da admissão.' };
    if (!hasRulesFor(termination))
      return {
        field: 'termination',
        message: `Por enquanto só há regras de INSS e IRRF a partir de ${formatBrDate(earliestRulesDate())}. Desligamentos anteriores usavam outras tabelas.`,
      };
    if (grossCents <= 0) return { field: 'gross', message: 'Informe um salário bruto maior que zero.' };

    const rules = getRulesFor(termination); // regras vigentes na data de desligamento
    return calculateTermination(
      {
        admissionDate: admission,
        terminationDate: termination,
        grossSalary: grossCents,
        averageVariables: averageVariables ? toCents(parseBrNumber(averageVariables)) : undefined,
        terminationType,
        noticeMode,
        dependents: Number(dependents) || 0,
        daysWorkedInLastMonth: Number(daysWorked) || 0,
        actualFgtsBalance: fgtsBalance ? toCents(parseBrNumber(fgtsBalance)) : undefined,
        expiredVacationDays: hasExpiredVacation ? Number(expiredVacationOwed) || 0 : 0,
        expiredVacationDoubled: hasExpiredVacation && expiredVacationDoubled,
      },
      rules
    );
  }

  const { result, errorFor, handleSubmit, resultRef } = useLiveCalculation(compute());

  return (
    <div className="calc-layout">
      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <div className="grid grid-cols-2 gap-4">
          <DateInput id="admission" label="Data de admissão" value={admissionDate} onChange={setAdmissionDate} error={errorFor('admission')} />
          <DateInput id="termination" label="Data de desligamento" value={terminationDate} onChange={setTerminationDate} error={errorFor('termination')} />
        </div>

        <CurrencyInput id="gross" label="Salário bruto" value={gross} onChange={setGross} required error={errorFor('gross')} />
        <CurrencyInput
          id="averageVariables"
          label="Média mensal de variáveis habituais (opcional)"
          value={averageVariables}
          onChange={setAverageVariables}
          hint="Horas extras, comissões e adicionais recebidos com frequência — média dos últimos 12 meses. Entra no aviso indenizado, 13º, férias e FGTS."
        />

        <div>
          <label htmlFor="type" className="mb-1 block text-sm font-medium">
            Tipo de desligamento
          </label>
          <select
            id="type"
            value={terminationType}
            onChange={(e) => setTerminationType(e.target.value as TerminationType)}
            className="w-full rounded-md border px-3 py-2"
          >
            {TERMINATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="noticeMode" className="mb-1 block text-sm font-medium">
            Aviso prévio
          </label>
          <select
            id="noticeMode"
            value={noticeMode}
            onChange={(e) => setNoticeMode(e.target.value as NoticeMode)}
            className="w-full rounded-md border px-3 py-2"
          >
            <option value="indemnified">Indenizado</option>
            <option value="worked">Trabalhado</option>
            {terminationType === 'employee_resignation' && (
              <option value="not_fulfilled_by_employee">Não cumprido pelo empregado</option>
            )}
          </select>
        </div>

        <NumberInput
          id="daysWorked"
          label="Dias trabalhados no mês do desligamento"
          value={daysWorked}
          onChange={(v) => {
            setDaysWorked(v);
            setDaysWorkedTouched(true);
          }}
          min={0}
          max={31}
          hint="Dias do último mês já trabalhados e ainda não pagos (saldo de salário) — sugerido a partir das datas acima; ajuste só se houve faltas não remuneradas."
        />
        <NumberInput id="dependents" label="Número de dependentes" value={dependents} onChange={setDependents} min={0} />
        <CurrencyInput id="fgts" label="Saldo do FGTS (opcional, para um valor exato)" value={fgtsBalance} onChange={setFgtsBalance} />

        <div className="space-y-4 rounded-md border border-dashed p-4">
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={hasExpiredVacation}
              onChange={(e) => setHasExpiredVacation(e.target.checked)}
            />
            <span>
              <span className="font-medium">Tenho férias vencidas</span>
              <span className="block text-xs text-gray-500">
                Marque só se você já completou um período aquisitivo de 12 meses e ainda não tirou todos os dias
                de férias dele. As férias proporcionais do período atual já entram no cálculo.
              </span>
            </span>
          </label>
          {hasExpiredVacation && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <NumberInput
                  id="expiredTaken"
                  label="Dias já gozados desse período vencido"
                  value={expiredVacationTaken}
                  onChange={setExpiredVacationTaken}
                  min={0}
                  max={30}
                />
                <NumberInput
                  id="expiredOwed"
                  label="Dias a receber (vencidos)"
                  value={expiredVacationOwed}
                  onChange={(v) => {
                    setExpiredVacationOwed(v);
                    setExpiredVacationOwedTouched(true);
                  }}
                  min={0}
                  max={30}
                  hint="Sugerido como 30 − dias já gozados; ajuste se o período vencido não for de 30 dias."
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={expiredVacationDoubled}
                  onChange={(e) => setExpiredVacationDoubled(e.target.checked)}
                />
                Período concessivo (12 meses após vencer) já expirou — pagar em dobro (Súmula 450 TST)
              </label>
            </>
          )}
        </div>

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
