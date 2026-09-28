import { parseRuleSets, type RuleSet } from './schema';
import { ruleSet2026_01 } from './2026-01';

/**
 * Fallback rule sets embedded in the bundle. Used whenever the remote JSON
 * (fetched at build time / revalidated via ISR, see Fase 1 §4.1) is
 * unavailable or fails schema validation. Add a new rule set here (or in the
 * remote source) whenever legislation changes — never edit the engine.
 */
const fallbackRuleSets: RuleSet[] = parseRuleSets([ruleSet2026_01]);

let cachedRemoteRuleSets: RuleSet[] | null = null;

/**
 * Loads rule sets from the remote source configured via RULES_SOURCE_URL,
 * validates them, and falls back to the embedded copy on any failure
 * (network error, non-200, invalid JSON, or schema validation failure).
 * Intended to be called at build time / during ISR revalidation.
 */
export async function loadRuleSets(fetchImpl: typeof fetch = fetch): Promise<RuleSet[]> {
  if (cachedRemoteRuleSets) return cachedRemoteRuleSets;

  const remoteUrl = process.env.RULES_SOURCE_URL;
  if (!remoteUrl) return fallbackRuleSets;

  try {
    const res = await fetchImpl(remoteUrl, { next: { revalidate: 60 * 60 * 24 } } as RequestInit);
    if (!res.ok) throw new Error(`Rules source responded with ${res.status}`);
    const raw = await res.json();
    const parsed = parseRuleSets(raw);
    cachedRemoteRuleSets = parsed;
    return parsed;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[rules] Failed to load remote rule sets, using embedded fallback:', err);
    return fallbackRuleSets;
  }
}

/**
 * Picks the rule set in force on the given reference date (the newest
 * ruleSet whose effectiveFrom is <= date). For a rescisão, the reference
 * date is the desligamento date, not "today".
 */
export function getRulesFor(date: Date, ruleSets: RuleSet[] = fallbackRuleSets): RuleSet {
  const candidates = ruleSets
    .filter((rs) => new Date(rs.effectiveFrom).getTime() <= date.getTime())
    .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());

  const chosen = candidates[0];
  if (!chosen) {
    throw new Error(
      `No rule set is effective on or before ${date.toISOString()}. Earliest available: ${
        ruleSets.map((r) => r.effectiveFrom).sort()[0]
      }`
    );
  }
  return chosen;
}

export function earliestRulesDate(ruleSets: RuleSet[] = fallbackRuleSets): Date {
  return new Date(ruleSets.map((r) => r.effectiveFrom).sort()[0]!);
}

export function hasRulesFor(date: Date, ruleSets: RuleSet[] = fallbackRuleSets): boolean {
  return date.getTime() >= earliestRulesDate(ruleSets).getTime();
}

export type { RuleSet } from './schema';
export { fallbackRuleSets };
