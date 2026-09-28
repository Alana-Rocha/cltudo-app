'use client';

import { useSyncExternalStore } from 'react';

/** `null` = a pessoa ainda não escolheu (mostra o aviso). */
export type ConsentChoice = 'accepted' | 'rejected' | null;

const STORAGE_KEY = 'cookie-consent';
const CHANGE_EVENT = 'cookie-consent-change';
// Mudou o que é coletado? Suba a versão para pedir o consentimento de novo.
const CONSENT_VERSION = 1;

function read(): ConsentChoice {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { choice?: ConsentChoice; version?: number };
    return parsed.version === CONSENT_VERSION && (parsed.choice === 'accepted' || parsed.choice === 'rejected')
      ? parsed.choice
      : null;
  } catch {
    return null;
  }
}

export function setConsent(choice: ConsentChoice) {
  try {
    if (choice === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice, version: CONSENT_VERSION, at: new Date().toISOString() }));
  } catch {
    // sem localStorage a escolha vale só para esta visita
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/** No servidor e antes da hidratação devolve 'pending', para nada de terceiros carregar cedo demais. */
export function useConsent(): ConsentChoice | 'pending' {
  return useSyncExternalStore(subscribe, read, () => 'pending');
}
