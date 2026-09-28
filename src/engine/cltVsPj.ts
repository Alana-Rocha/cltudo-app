import type { Bracket, RuleSet } from '@/rules/schema';
import { add, max, min, multiply, subtract, type Cents } from '@/lib/money';
import { formatCurrency, formatPercent } from '@/lib/format';
import { calculateSalary } from './salary';
import { calculateVacation } from './vacation';
import { calculateThirteenth } from './thirteenth';
import { calculateIrrf } from './irrf';
import type { CalculationResult } from './types';

export type CltVsPjInput = {
  cltGross: Cents;
  dependents: number;
  cltMonthlyBenefits?: Cents; // VR, VA, plano de saúde
  pjMonthlyRevenue: Cents;
  pjMonthlyCosts?: Cents; // contador, certificado, taxas
};

type Annex = 'III' | 'V';

export type PjScenario = {
  annex: Annex;
  effectiveRate: number;
  proLabore: Cents;
  das: Cents;
  inss: Cents;
  irrf: Cents;
  costs: Cents;
  profit: Cents;
  dividendTax: Cents;
  monthlyNet: Cents;
};

/** Alíquota efetiva do Simples: (RBT12 × alíquota − parcela a deduzir) ÷ RBT12; null acima do limite do Simples. */
function simplesEffectiveRate(rbt12: Cents, brackets: Bracket[]): number | null {
  for (const b of brackets) {
    if (b.upTo === null || rbt12 <= b.upTo) {
      return rbt12 > 0 ? (rbt12 * b.rate - b.deduction) / rbt12 : b.rate;
    }
  }
  return null;
}

function pjScenario(revenue: Cents, costs: Cents, dependents: number, annex: Annex, rules: RuleSet): PjScenario | null {
  const brackets = annex === 'III' ? rules.simplesNacional.annexIII : rules.simplesNacional.annexV;
  const effectiveRate = simplesEffectiveRate(revenue * 12, brackets);
  if (effectiveRate === null) return null;

  // No Anexo III o pró-labore precisa atingir o fator R; no V, basta o mínimo legal.
  const proLabore =
    annex === 'III'
      ? max(rules.minimumWage, Math.ceil(revenue * rules.simplesNacional.factorRThreshold))
      : rules.minimumWage;
  const das = multiply(revenue, effectiveRate);
  const inss = multiply(min(proLabore, rules.inss.ceiling), rules.proLabore.inssRate);
  const irrf = calculateIrrf({ taxableIncome: proLabore, inss, dependents }, rules).total;
  const profit = subtract(revenue, add(das, costs, proLabore));
  const dividendTax = profit > rules.dividends.monthlyExemptUpTo ? multiply(profit, rules.dividends.withholdingRate) : 0;
  const monthlyNet = subtract(add(proLabore, profit), add(inss, irrf, dividendTax));

  return { annex, effectiveRate, proLabore, das, inss, irrf, costs, profit, dividendTax, monthlyNet };
}

export function bestPjScenario(revenue: Cents, costs: Cents, dependents: number, rules: RuleSet): PjScenario | null {
  const options = [pjScenario(revenue, costs, dependents, 'III', rules), pjScenario(revenue, costs, dependents, 'V', rules)].filter(
    (s): s is PjScenario => s !== null
  );
  return options.sort((a, b) => b.monthlyNet - a.monthlyNet)[0] ?? null;
}

function cltAnnualPackage(input: CltVsPjInput, rules: RuleSet) {
  const s = input.cltGross;
  const salaryNet = calculateSalary({ grossSalary: s, dependents: input.dependents }, rules).totals.net;
  const vacationNet = calculateVacation({ grossSalary: s, daysTaken: 30, daysSold: 0, dependents: input.dependents }, rules).totals.net;
  const thirteenthNet = calculateThirteenth({ grossSalary: s, monthsWorked: 12, dependents: input.dependents }, rules).totals.net;
  // FGTS sobre 12 salários, o 13º e o 1/3 de férias.
  const fgts = multiply(s, rules.fgts.monthlyRate * (13 + rules.vacation.bonusFraction));
  const benefits = multiply(input.cltMonthlyBenefits ?? 0, 12);
  const salaries = multiply(salaryNet, 11);
  return { salaries, vacationNet, thirteenthNet, fgts, benefits, total: add(salaries, vacationNet, thirteenthNet, fgts, benefits) };
}

/** Faturamento mensal PJ cujo líquido anual iguala o pacote CLT (busca binária, precisão de 1 centavo). */
function equivalentRevenue(target: Cents, costs: Cents, dependents: number, rules: RuleSet): Cents | null {
  const simplesLimit = Math.floor((rules.simplesNacional.annexIII.at(-1)?.upTo ?? 0) / 12);
  const annualNet = (revenue: Cents) => (bestPjScenario(revenue, costs, dependents, rules)?.monthlyNet ?? -Infinity) * 12;
  if (annualNet(simplesLimit) < target) return null;

  let lo = 0;
  let hi = simplesLimit;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (annualNet(mid) >= target) hi = mid;
    else lo = mid;
  }
  return hi;
}

/** `totals.net` é a diferença anual PJ − CLT (negativa quando a CLT rende mais). */
export function calculateCltVsPj(input: CltVsPjInput, rules: RuleSet): CalculationResult {
  const costs = input.pjMonthlyCosts ?? 0;
  const clt = cltAnnualPackage(input, rules);
  const pj = bestPjScenario(input.pjMonthlyRevenue, costs, input.dependents, rules);
  const warnings: string[] = [];

  if (!pj) {
    warnings.push(`Faturamento acima do limite anual do Simples Nacional (${formatCurrency(rules.simplesNacional.annexIII.at(-1)?.upTo ?? 0)}): esta comparação não se aplica.`);
  }

  const pjAnnual = pj ? multiply(pj.monthlyNet, 12) : 0;
  const equivalent = equivalentRevenue(clt.total, costs, input.dependents, rules);
  const year = (v: Cents) => multiply(v, 12);

  const annexNote = pj
    ? pj.annex === 'III'
      ? `Simples Nacional, Anexo III (alíquota efetiva de ${formatPercent(pj.effectiveRate, 2)}), com pró-labore de ${formatCurrency(pj.proLabore)} para atingir o fator R de ${formatPercent(rules.simplesNacional.factorRThreshold, 0)}.`
      : `Simples Nacional, Anexo V (alíquota efetiva de ${formatPercent(pj.effectiveRate, 2)}), com pró-labore de um salário mínimo — aqui sai mais barato que manter o fator R.`
    : '';

  warnings.push(
    'Como PJ não há férias remuneradas, 13º, FGTS nem seguro-desemprego: a comparação supõe faturar os 12 meses do ano.',
    'Supõe atividade de serviço sujeita ao fator R (ex.: tecnologia, consultoria). A reforma tributária (CBS/IBS) começa a valer a partir de 2027 e pode mudar a carga do PJ.'
  );
  if (pj && pj.dividendTax > 0) {
    warnings.push(`Lucro distribuído acima de ${formatCurrency(rules.dividends.monthlyExemptUpTo)} por mês tem retenção de ${formatPercent(rules.dividends.withholdingRate, 0)} de IR (Lei 15.270/2025).`);
  }

  return {
    items: [
      { key: 'clt-salaries', label: '11 salários líquidos', group: 'CLT (por ano)', amount: clt.salaries, type: 'earning', explanation: 'O 12º mês é pago como férias' },
      { key: 'clt-vacation', label: 'Férias com 1/3 (líquido)', group: 'CLT (por ano)', amount: clt.vacationNet, type: 'earning', explanation: '30 dias de férias' },
      { key: 'clt-13', label: '13º (líquido)', group: 'CLT (por ano)', amount: clt.thirteenthNet, type: 'earning', explanation: '1ª + 2ª parcela' },
      { key: 'clt-fgts', label: 'FGTS depositado', group: 'CLT (por ano)', amount: clt.fgts, type: 'earning', explanation: 'Sobre salários, 13º e 1/3 de férias' },
      ...(clt.benefits > 0 ? [{ key: 'clt-benefits', label: 'Benefícios', group: 'CLT (por ano)', amount: clt.benefits, type: 'earning' as const, explanation: '12 meses' }] : []),
      { key: 'clt-total', label: 'Total CLT por ano', group: 'CLT (por ano)', amount: clt.total, type: 'info', explanation: `${formatCurrency(Math.round(clt.total / 12))} por mês, em média` },
      ...(pj
        ? [
            { key: 'pj-revenue', label: 'Faturamento anual', group: 'PJ (por ano)', amount: year(input.pjMonthlyRevenue), type: 'earning' as const, explanation: `${formatCurrency(input.pjMonthlyRevenue)} × 12` },
            { key: 'pj-das', label: 'Impostos do Simples (DAS)', group: 'PJ (por ano)', amount: year(pj.das), type: 'deduction' as const, explanation: `Anexo ${pj.annex}, ${formatPercent(pj.effectiveRate, 2)} do faturamento`, legalBasis: 'LC 123/2006' },
            { key: 'pj-inss', label: 'INSS do pró-labore', group: 'PJ (por ano)', amount: year(pj.inss), type: 'deduction' as const, explanation: `${formatPercent(rules.proLabore.inssRate, 0)} de ${formatCurrency(pj.proLabore)}` },
            { key: 'pj-irrf', label: 'IRRF do pró-labore', group: 'PJ (por ano)', amount: year(pj.irrf), type: 'deduction' as const, explanation: 'Tabela mensal do IR' },
            ...(costs > 0 ? [{ key: 'pj-costs', label: 'Custos da empresa', group: 'PJ (por ano)', amount: year(costs), type: 'deduction' as const, explanation: 'Contador, taxas etc.' }] : []),
            ...(pj.dividendTax > 0 ? [{ key: 'pj-dividends', label: 'IR sobre dividendos', group: 'PJ (por ano)', amount: year(pj.dividendTax), type: 'deduction' as const, explanation: 'Lei 15.270/2025' }] : []),
            { key: 'pj-total', label: 'Total PJ por ano', group: 'PJ (por ano)', amount: pjAnnual, type: 'info' as const, explanation: `${formatCurrency(pj.monthlyNet)} por mês` },
          ]
        : []),
      ...(equivalent !== null
        ? [{ key: 'equivalent', label: 'Faturamento PJ para empatar com a CLT', group: 'Comparação', amount: equivalent, type: 'info' as const, explanation: 'Por mês, com os mesmos custos informados' }]
        : []),
    ],
    totals: { gross: pjAnnual, deductions: clt.total, net: subtract(pjAnnual, clt.total) },
    steps: [
      { label: 'Pacote CLT anual', formula: '11 salários + férias + 13º + FGTS + benefícios (líquidos)', value: clt.total },
      ...(pj ? [{ label: 'PJ anual', formula: '12 × (pró-labore + lucro − DAS − INSS − IRRF − custos)', value: pjAnnual }] : []),
    ],
    included: annexNote ? [annexNote] : [],
    excluded: [],
    warnings,
    rulesVersion: rules.id,
  };
}
