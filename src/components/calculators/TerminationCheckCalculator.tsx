'use client';

import { AlertTriangle, CheckCircle2, CircleAlert } from 'lucide-react';
import { usePersistedState } from '@/hooks/usePersistedState';
import { useLiveCalculation } from '@/hooks/useLiveCalculation';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { DateInput } from '@/components/ui/DateInput';
import { CalculationBreakdown } from '@/components/shared/CalculationBreakdown';
import { Disclaimer } from '@/components/shared/Disclaimer';
import { projectedContractEnd } from '@/engine/termination';
import {
  applicableItems,
  compareTermination,
  latePaymentFine,
  ROUNDING_TOLERANCE,
  terminationDeadlines,
  type CheckedItem,
  type CheckRow,
  type Deadline,
  type ReceivedAmounts,
} from '@/engine/terminationCheck';
import type { CalculationResult } from '@/engine/types';
import { getRulesFor } from '@/rules';
import { formatBrDate, parseBrDate } from '@/lib/dates';
import { formatCurrency } from '@/lib/format';
import { toCents, type Cents } from '@/lib/money';
import { parseBrNumber, useTerminationForm } from './useTerminationForm';

const STORAGE_PREFIX = 'conferir-rescisao';

const RECEIVED_FIELDS: Record<CheckedItem, { label: string; hint?: string }> = {
  net: { label: 'Total líquido recebido', hint: 'O "valor líquido" do Termo de Rescisão (TRCT). Só com ele já dá para conferir.' },
  balance: { label: 'Saldo de salário recebido' },
  notice: { label: 'Aviso prévio indenizado recebido' },
  thirteenth: { label: '13º proporcional recebido' },
  vacation: { label: 'Férias + 1/3 recebidas', hint: 'Some férias proporcionais, vencidas e o 1/3 que aparecem no TRCT.' },
  inss: { label: 'INSS descontado no TRCT' },
  irrf: { label: 'IRRF descontado no TRCT' },
  fgtsFine: { label: 'Multa do FGTS depositada', hint: 'Não aparece no TRCT: veja no extrato do app FGTS.' },
};

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

function deadlineStatus(deadline: Deadline, today: Date): string {
  if (deadline.from && today < deadline.from) return `abre em ${formatBrDate(deadline.from)}`;
  const daysLeft = daysBetween(today, deadline.until);
  if (daysLeft < 0) return 'prazo encerrado';
  if (daysLeft === 0) return 'último dia é hoje';
  return `falta${daysLeft === 1 ? '' : 'm'} ${daysLeft} dia${daysLeft === 1 ? '' : 's'}`;
}

function RowStatus({ row }: { row: CheckRow }) {
  if (row.status === 'not_informed') return <span className="text-gray-400">não informado</span>;
  if (row.status === 'ok') return <span className="font-medium text-emerald-700">confere</span>;
  if (row.status === 'short') return <span className="font-semibold text-red-600">faltam {formatCurrency(row.shortfall)}</span>;
  return <span className="font-medium text-amber-700">{formatCurrency(-row.shortfall)} a mais</span>;
}

function CheckSummary({
  due,
  received,
  lateFine,
  deadlines,
}: {
  due: CalculationResult;
  received: ReceivedAmounts;
  lateFine: { fine: Cents; daysLate: number; deadline: Date } | null;
  deadlines: Deadline[];
}) {
  const check = compareTermination(due, received);
  const fine = lateFine?.fine ?? 0;
  const total = check.totalShortfall + fine;
  const today = todayUtc();
  const lawsuit = deadlines.find((deadline) => deadline.key === 'lawsuit');

  return (
    <div className="card mb-6 overflow-hidden">
      {check.informedCount === 0 && fine === 0 ? (
        <p className="border-b px-6 py-5 text-sm text-gray-600">
          Preencha o que você recebeu para comparar com o que é devido. Os prazos abaixo já valem para o seu caso.
        </p>
      ) : (
        <div className="result-hero border-b px-6 py-7 text-center">
          <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-gray-600">
            {total > ROUNDING_TOLERANCE ? (
              <CircleAlert className="h-4 w-4 text-red-600" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            )}
            {total > ROUNDING_TOLERANCE
              ? 'Faltam na sua rescisão'
              : total < -ROUNDING_TOLERANCE
                ? 'Você recebeu a mais'
                : 'Os valores conferem'}
          </p>
          <p data-testid="check-headline" className="mt-1 text-4xl font-bold tracking-tight text-brand-700 tabular-nums">
            {formatCurrency(Math.abs(total))}
          </p>
          {fine > 0 && check.totalShortfall !== 0 && (
            <p className="mt-2 text-xs text-gray-500">
              {formatCurrency(check.totalShortfall)} nas verbas + {formatCurrency(fine)} de multa por atraso
            </p>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Comparação verba a verba</caption>
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
              <th scope="col" className="px-6 py-2 font-semibold">Verba</th>
              <th scope="col" className="px-2 py-2 text-right font-semibold">Devido</th>
              <th scope="col" className="px-2 py-2 text-right font-semibold">Recebido</th>
              <th scope="col" className="hidden px-6 py-2 text-right font-semibold sm:table-cell">Diferença</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {check.rows.map((row) => (
              <tr key={row.key}>
                <th scope="row" className="px-6 py-2.5 text-left font-medium">
                  {row.label}
                  <span className="block text-xs font-normal text-gray-500">{row.legalBasis}</span>
                  {/* No celular a diferença vai sob o nome da verba, para não ficar fora da tela. */}
                  <span className="mt-0.5 block text-xs sm:hidden">
                    <RowStatus row={row} />
                  </span>
                </th>
                <td className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums">{formatCurrency(row.due)}</td>
                <td className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums">
                  {row.received === undefined ? '—' : formatCurrency(row.received)}
                </td>
                <td className="hidden whitespace-nowrap px-6 py-2.5 text-right tabular-nums sm:table-cell">
                  <RowStatus row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {lateFine && lateFine.fine > 0 && (
        <div role="alert" className="flex gap-2 border-t bg-red-50 px-6 py-3 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Pagamento {lateFine.daysLate} dia{lateFine.daysLate === 1 ? '' : 's'} depois do prazo ({formatBrDate(lateFine.deadline)}):
            a empresa deve uma multa de <strong>{formatCurrency(lateFine.fine)}</strong>, um salário (CLT art. 477, §8º).
          </p>
        </div>
      )}

      <section aria-labelledby="deadlines-title" className="border-t px-6 py-5">
        <h3 id="deadlines-title" className="text-sm font-semibold">
          Prazos
        </h3>
        <ul className="mt-3 space-y-3 text-sm">
          {deadlines.map((deadline) => (
            <li key={deadline.key}>
              <p className="flex flex-wrap items-baseline justify-between gap-x-4">
                <span className="font-medium">{deadline.label}</span>
                <span className="tabular-nums">
                  {deadline.from ? `${formatBrDate(deadline.from)} a ` : 'até '}
                  {formatBrDate(deadline.until)} · <span className="text-gray-500">{deadlineStatus(deadline, today)}</span>
                </span>
              </p>
              <p className="text-xs text-gray-500">
                {deadline.description} ({deadline.legalBasis})
              </p>
            </li>
          ))}
        </ul>
      </section>

      {total > ROUNDING_TOLERANCE && (
        <section aria-labelledby="next-steps-title" className="border-t bg-gray-50 px-6 py-5 text-sm">
          <h3 id="next-steps-title" className="font-semibold">
            O que fazer
          </h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-gray-600">
            <li>Peça a correção ao RH levando este relatório (botão Imprimir, mais abaixo).</li>
            <li>Se não resolver, procure o sindicato da sua categoria: a orientação costuma ser gratuita.</li>
            {lawsuit && <li>Você pode reclamar na Justiça do Trabalho até {formatBrDate(lawsuit.until)}.</li>}
          </ol>
        </section>
      )}
    </div>
  );
}

export function TerminationCheckCalculator() {
  const form = useTerminationForm(STORAGE_PREFIX);
  const [receivedText, setReceivedText] = usePersistedState<Record<string, string>>(`${STORAGE_PREFIX}:received`, {});
  const [paymentDate, setPaymentDate] = usePersistedState(`${STORAGE_PREFIX}:paymentDate`, '');
  const { result, errorFor, handleSubmit, resultRef } = useLiveCalculation(form.outcome);

  const received: ReceivedAmounts = {};
  for (const [key, text] of Object.entries(receivedText)) {
    if (typeof text === 'string' && text !== '') received[key as CheckedItem] = toCents(parseBrNumber(text));
  }

  const input = form.input;
  const deadlines = input
    ? terminationDeadlines({
        terminationDate: input.terminationDate,
        projectedEndDate: projectedContractEnd(input, getRulesFor(input.terminationDate)),
        terminationType: input.terminationType,
      })
    : [];
  const paidOn = parseBrDate(paymentDate);
  const lateFine =
    input && paidOn ? latePaymentFine({ terminationDate: input.terminationDate, paymentDate: paidOn, grossSalary: input.grossSalary }) : null;

  return (
    <div className="calc-layout">
      <form onSubmit={handleSubmit} noValidate className="card space-y-4 p-6">
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold">Seu contrato</legend>
          {form.renderFields(errorFor)}
        </fieldset>

        <fieldset className="space-y-4 border-t pt-4">
          <legend className="text-sm font-semibold">O que você recebeu</legend>
          <p className="text-xs text-gray-500">Copie do Termo de Rescisão (TRCT). Preencha só o que quiser conferir.</p>
          {applicableItems(result).map(({ key }) => (
            <CurrencyInput
              key={key}
              id={`received-${key}`}
              label={RECEIVED_FIELDS[key].label}
              hint={RECEIVED_FIELDS[key].hint}
              value={receivedText[key] ?? ''}
              onChange={(value) => setReceivedText((previous) => ({ ...previous, [key]: value }))}
            />
          ))}
          <DateInput
            id="paymentDate"
            label="Data em que a rescisão foi paga (opcional)"
            value={paymentDate}
            onChange={setPaymentDate}
            hint="Para saber se houve atraso e multa."
          />
        </fieldset>

        <button type="submit" className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">
          Conferir
        </button>
      </form>
      <div ref={resultRef} className="calc-result scroll-mt-20">
        {result && (
          <>
            <CheckSummary due={result} received={received} lateFine={lateFine} deadlines={deadlines} />
            <h2 className="mb-3 text-lg font-semibold">Como calculamos o valor devido</h2>
            <CalculationBreakdown result={result} headline={{ label: 'Total líquido devido (com a multa do FGTS)' }} />
          </>
        )}
      </div>
      <Disclaimer />
    </div>
  );
}
