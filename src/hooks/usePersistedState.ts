'use client';

import { useEffect, useState } from 'react';
import { formValues, readSharedState } from '@/lib/shareState';

// Links compartilhados vêm de fora: um valor de outro tipo (objeto, null,
// número no lugar de texto) quebraria a calculadora ao renderizar.
function isSameType<T>(candidate: unknown, initialValue: T): candidate is T {
  return typeof candidate === typeof initialValue && candidate !== null && !Array.isArray(candidate);
}

let legacyStorageCleared = false;

// Versões anteriores guardavam os valores no localStorage: apaga o que ficou lá.
function clearLegacyStorage() {
  if (legacyStorageCleared) return;
  legacyStorageCleared = true;
  try {
    Object.keys(localStorage)
      .filter((key) => /^(calculadora-|conferir-)[^:]*:/.test(key))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // localStorage indisponível (modo privado, etc.) — não há o que apagar.
  }
}

/**
 * Like useState, but keeps the value in memory under `key`, so it survives
 * navigating between pages and is gone on reload: nothing typed stays saved in
 * the browser. Always starts from `initialValue` on the first render (server and
 * client match, avoiding a hydration mismatch) and swaps in the kept value right
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
    clearLegacyStorage();
    const fromLink = readSharedState();
    const candidate = fromLink && key in fromLink ? fromLink[key] : formValues.get(key);
    if (isSameType(candidate, initialValue)) setValue(candidate);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!hydrated) return; // evita sobrescrever o valor guardado com o initialValue antes da hidratação
    formValues.set(key, value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, hydrated, value]);

  return [value, setValue] as const;
}
