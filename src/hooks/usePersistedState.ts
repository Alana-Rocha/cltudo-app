'use client';

import { useEffect, useState } from 'react';
import { readSharedState } from '@/lib/shareState';

// Links compartilhados e o localStorage vêm de fora: um valor de outro tipo
// (objeto, null, número no lugar de texto) quebraria a calculadora ao renderizar.
function isSameType<T>(candidate: unknown, initialValue: T): candidate is T {
  return typeof candidate === typeof initialValue && candidate !== null && !Array.isArray(candidate);
}

/**
 * Like useState, but rehydrates from and syncs to localStorage under `key`.
 * Always starts from `initialValue` on the first render (server and client
 * match, avoiding a hydration mismatch) and swaps in the stored value right
 * after mount, if any.
 *
 * `hydrated` is state (not a ref) on purpose: the read effect's `setValue`
 * and `setHydrated` calls get batched into the same next render, so the
 * write effect below only ever sees them flip together. A ref would let the
 * write effect fire, on the same synchronous pass, with `hydrated` already
 * true but `value` still stale — clobbering the just-read data. That race
 * is also what React's Strict Mode double-invoking mount effects in dev
 * would expose immediately.
 */
export function usePersistedState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const fromLink = readSharedState();
      const stored = localStorage.getItem(key);
      const candidate = fromLink && key in fromLink ? fromLink[key] : stored !== null ? JSON.parse(stored) : undefined;
      if (isSameType(candidate, initialValue)) setValue(candidate);
    } catch {
      // localStorage indisponível ou valor corrompido — mantém o padrão.
    } finally {
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!hydrated) return; // evita sobrescrever o valor salvo com o initialValue antes da hidratação
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage indisponível (modo privado, cota cheia, etc.) — segue sem persistir.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, hydrated, value]);

  return [value, setValue] as const;
}
