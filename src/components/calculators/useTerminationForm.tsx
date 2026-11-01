'use client';

import { useEffect } from 'react';
import { usePersistedState } from '@/hooks/usePersistedState';
import type { FieldError } from '@/hooks/useLiveCalculation';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Checkbox } from '@/components/ui/Checkbox';
import { NumberInput } from '@/components/ui/NumberInput';
import { Select } from '@/components/ui/Select';
import { DateInput } from '@/components/ui/DateInput';
import { calculateTermination, type NoticeMode, type TerminationInput } from '@/engine/termination';
import type { TerminationType } from '@/engine/fgts';
import { earliestRulesDate, getRulesFor, hasRulesFor } from '@/rules';
import { toCents } from '@/lib/money';
import { formatBrDate, parseBrDate } from '@/lib/dates';
import type { CalculationResult } from '@/engine/types';

export function parseBrNumber(input: string): number {
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

function isFieldError(value: TerminationInput | FieldError): value is FieldError {
  return 'message' in value;
}

/**
 * Campos e validação da rescisão, compartilhados pela calculadora e pela conferência.
 * `storagePrefix` é o slug da página: o link compartilhado leva só as chaves com esse prefixo.
 */
export function useTerminationForm(storagePrefix: string) {
  const [admissionDate, setAdmissionDate] = usePersistedState(`${storagePrefix}:admissionDate`, '');
  const [terminationDate, setTerminationDate] = usePersistedState(`${storagePrefix}:terminationDate`, '');
  const [gross, setGross] = usePersistedState(`${storagePrefix}:gross`, '');
  const [averageVariables, setAverageVariables] = usePersistedState(`${storagePrefix}:averageVariables`, '');
  const [terminationType, setTerminationType] = usePersistedState<TerminationType>(`${storagePrefix}:terminationType`, 'without_cause');
  const [noticeMode, setNoticeMode] = usePersistedState<NoticeMode>(`${storagePrefix}:noticeMode`, 'indemnified');
  // "Não cumprido" só existe no pedido de demissão; ao trocar o tipo, volta para indenizado.
  const effectiveNoticeMode: NoticeMode =
    noticeMode === 'not_fulfilled_by_employee' && terminationType !== 'employee_resignation' ? 'indemnified' : noticeMode;
  const [daysWorked, setDaysWorked] = usePersistedState(`${storagePrefix}:daysWorked`, '30');
  const [daysWorkedTouched, setDaysWorkedTouched] = usePersistedState(`${storagePrefix}:daysWorkedTouched`, false);
  const [dependents, setDependents] = usePersistedState(`${storagePrefix}:dependents`, '0');
  const [fgtsBalance, setFgtsBalance] = usePersistedState(`${storagePrefix}:fgtsBalance`, '');
  const [hasExpiredVacation, setHasExpiredVacation] = usePersistedState(`${storagePrefix}:hasExpiredVacation`, false);
  const [expiredVacationTaken, setExpiredVacationTaken] = usePersistedState(`${storagePrefix}:expiredVacationTaken`, '0');
  const [expiredVacationOwed, setExpiredVacationOwed] = usePersistedState(`${storagePrefix}:expiredVacationOwed`, '0');
  const [expiredVacationOwedTouched, setExpiredVacationOwedTouched] = usePersistedState(`${storagePrefix}:expiredVacationOwedTouched`, false);
  const [expiredVacationDoubled, setExpiredVacationDoubled] = usePersistedState(`${storagePrefix}:expiredVacationDoubled`, false);

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

  function buildInput(): TerminationInput | FieldError {
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

    return {
      admissionDate: admission,
      terminationDate: termination,
      grossSalary: grossCents,
      averageVariables: averageVariables ? toCents(parseBrNumber(averageVariables)) : undefined,
      terminationType,
      noticeMode: effectiveNoticeMode,
      dependents: Number(dependents) || 0,
      daysWorkedInLastMonth: Number(daysWorked) || 0,
      actualFgtsBalance: fgtsBalance ? toCents(parseBrNumber(fgtsBalance)) : undefined,
      expiredVacationDays: hasExpiredVacation ? Number(expiredVacationOwed) || 0 : 0,
      expiredVacationDoubled: hasExpiredVacation && expiredVacationDoubled,
    };
  }

  const built = buildInput();
  const input = isFieldError(built) ? null : built;
  // Regras vigentes na data do desligamento, não na data de hoje.
  const outcome: CalculationResult | FieldError = input
    ? calculateTermination(input, getRulesFor(input.terminationDate))
    : (built as FieldError);

  function renderFields(errorFor: (field: string) => string | undefined) {
    return (
      <>
          <div className="grid gap-4 sm:grid-cols-2">
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

          <Select id="type" label="Tipo de desligamento" value={terminationType} onChange={setTerminationType} options={TERMINATION_TYPES} />

          <Select
            id="noticeMode"
            label="Aviso prévio"
            value={effectiveNoticeMode}
            onChange={setNoticeMode}
            options={[
              { value: 'indemnified', label: 'Indenizado' },
              { value: 'worked', label: 'Trabalhado' },
              ...(terminationType === 'employee_resignation'
                ? [{ value: 'not_fulfilled_by_employee' as const, label: 'Não cumprido pelo empregado' }]
                : []),
            ]}
          />

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
            <Checkbox
              checked={hasExpiredVacation}
              onChange={setHasExpiredVacation}
              description="Marque só se você já completou um período aquisitivo de 12 meses e ainda não tirou todos os dias de férias dele. As férias proporcionais do período atual já entram no cálculo."
            >
              Tenho férias vencidas
            </Checkbox>
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
                <Checkbox checked={expiredVacationDoubled} onChange={setExpiredVacationDoubled}>
                  Período concessivo (12 meses após vencer) já expirou — pagar em dobro (Súmula 450 TST)
                </Checkbox>
              </>
            )}
          </div>
      </>
    );
  }

  return { input, outcome, renderFields };
}
