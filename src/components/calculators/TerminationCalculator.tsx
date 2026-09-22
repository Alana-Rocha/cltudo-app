'use client';

import { useEffect, useState } from 'react';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { NumberInput } from '@/components/ui/NumberInput';
import { DateInput } from '@/components/ui/DateInput';
import { CalculationBreakdown } from '@/components/shared/CalculationBreakdown';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { calculateTermination, type NoticeMode } from '@/engine/termination';
import type { TerminationType } from '@/engine/fgts';
import { getRulesFor } from '@/rules';
import { toCents } from '@/lib/money';
import { parseBrDate } from '@/lib/dates';
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
  const [admissionDate, setAdmissionDate] = useState('');
  const [terminationDate, setTerminationDate] = useState('');
  const [gross, setGross] = useState('');
  const [terminationType, setTerminationType] = useState<TerminationType>('without_cause');
  const [noticeMode, setNoticeMode] = useState<NoticeMode>('indemnified');
  const [daysWorked, setDaysWorked] = useState('30');
  const [daysWorkedTouched, setDaysWorkedTouched] = useState(false);
  const [dependents, setDependents] = useState('0');
  const [fgtsBalance, setFgtsBalance] = useState('');
  const [expiredVacationTaken, setExpiredVacationTaken] = useState('0');
  const [expiredVacationOwed, setExpiredVacationOwed] = useState('0');
  const [expiredVacationOwedTouched, setExpiredVacationOwedTouched] = useState(false);
  const [expiredVacationDoubled, setExpiredVacationDoubled] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const admission = parseBrDate(admissionDate);
    const termination = parseBrDate(terminationDate);
    const grossCents = toCents(parseBrNumber(gross));

    if (!admission) return setError('Informe a data de admissão no formato dd/mm/aaaa.');
    if (!termination) return setError('Informe a data de desligamento no formato dd/mm/aaaa.');
    if (termination.getTime() <= admission.getTime())
      return setError('A data de desligamento deve ser depois da admissão.');
    if (grossCents <= 0) return setError('Informe um salário bruto maior que zero.');

    setError(null);
    const rules = getRulesFor(termination); // regras vigentes na data de desligamento
    setResult(
      calculateTermination(
        {
          admissionDate: admission,
          terminationDate: termination,
          grossSalary: grossCents,
          terminationType,
          noticeMode,
          dependents: Number(dependents) || 0,
          daysWorkedInLastMonth: Number(daysWorked) || 0,
          actualFgtsBalance: fgtsBalance ? toCents(parseBrNumber(fgtsBalance)) : undefined,
          expiredVacationDays: Number(expiredVacationOwed) || 0,
          expiredVacationDoubled,
        },
        rules
      )
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
        <div className="grid grid-cols-2 gap-4">
          <DateInput id="admission" label="Data de admissão" value={admissionDate} onChange={setAdmissionDate} />
          <DateInput id="termination" label="Data de desligamento" value={terminationDate} onChange={setTerminationDate} />
        </div>

        <CurrencyInput id="gross" label="Salário bruto" value={gross} onChange={setGross} required error={error ?? undefined} />

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
          <div>
            <p className="text-sm font-medium">Férias vencidas</p>
            <p className="text-xs text-gray-500">
              Preencha apenas se você já tem um período aquisitivo completo (12 meses) com dias de férias ainda não
              gozados. Deixe em 0 se este for o seu único período (proporcional), ainda em aberto.
            </p>
          </div>
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
        </div>

        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Calcular
        </button>
      </form>
      {result && <CalculationBreakdown result={result} />}
      <Disclaimer />
    </div>
  );
}
