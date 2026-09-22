import type { RuleSet } from '@/rules/schema';
import { fullYearsBetween, addDays } from '@/lib/dates';

export type NoticeReason = 'without_cause' | 'employee_resignation';

export type NoticeResult = {
  days: number;
  projectedEndDate: Date; // start + days, for avos projection when indenizado
};

/**
 * Aviso prévio duration (Lei 12.506/2011): 30 days + 3 days per full year of
 * service, capped at 90 days. The proportional increase ONLY applies to
 * dismissal without cause (3.7) — an employee's resignation is always 30
 * days regardless of tenure.
 */
export function calculateNotice(admissionDate: Date, referenceDate: Date, reason: NoticeReason, rules: RuleSet): NoticeResult {
  const days =
    reason === 'employee_resignation'
      ? rules.notice.employeeResignationDays
      : Math.min(
          rules.notice.baseDays + rules.notice.daysPerYear * fullYearsBetween(admissionDate, referenceDate),
          rules.notice.maxDays
        );

  return { days, projectedEndDate: addDays(referenceDate, days) };
}

/**
 * Standalone entry point for the aviso prévio calculator page (Fase 3):
 * wraps calculateNotice into the standard CalculationResult contract. Since
 * aviso prévio has no monetary "total" of its own outside a salary context,
 * `totals` reports the days as the "net" figure is not meaningful here —
 * callers combining this with a salary should multiply days/30 themselves
 * (see engine/termination.ts for the reference implementation).
 */
export function calculateNoticeStandalone(
  admissionDate: Date,
  referenceDate: Date,
  reason: NoticeReason,
  rules: RuleSet
): import('./types').CalculationResult {
  const result = calculateNotice(admissionDate, referenceDate, reason, rules);
  const years = Math.floor((result.days - rules.notice.baseDays) / rules.notice.daysPerYear);

  return {
    items: [
      { key: 'base', label: 'Aviso prévio base', amount: 0, type: 'info', explanation: `${rules.notice.baseDays} dias`, legalBasis: 'CLT art. 487' },
      ...(reason === 'without_cause' && years > 0
        ? [{ key: 'extra', label: 'Acréscimo por tempo de serviço', amount: 0, type: 'info' as const, explanation: `+${years} ano(s) completo(s) × ${rules.notice.daysPerYear} dias`, legalBasis: 'Lei 12.506/2011' }]
        : []),
      { key: 'total-days', label: 'Total de dias de aviso', amount: 0, type: 'info', explanation: `${result.days} dias (máximo ${rules.notice.maxDays})` },
      { key: 'projection', label: 'Data projetada de término do contrato', amount: 0, type: 'info', explanation: result.projectedEndDate.toISOString().slice(0, 10) },
    ],
    totals: { gross: 0, deductions: 0, net: 0 },
    steps: [{ label: 'Dias de aviso', formula: reason === 'without_cause' ? `${rules.notice.baseDays} + ${years} × ${rules.notice.daysPerYear}` : `${rules.notice.employeeResignationDays} (pedido de demissão)`, value: result.days, unit: 'days' }],
    included: [],
    excluded:
      reason === 'employee_resignation'
        ? ['O acréscimo proporcional por tempo de serviço não se aplica ao pedido de demissão: o aviso é sempre de 30 dias.']
        : [],
    warnings: ['Se o aviso for indenizado, ele projeta o tempo de serviço: conta para os avos de 13º e férias, usando a data projetada acima.'],
    rulesVersion: rules.id,
  };
}
