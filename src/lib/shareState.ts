const PARAM = 'dados';

function encode(data: Record<string, unknown>): string {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decode(value: string): Record<string, unknown> | null {
  try {
    const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// Keyed by the hash it was parsed from, so every hook mounting on
// the same URL reads the same values and a later navigation re-parses.
let cache: { hash: string; data: Record<string, unknown> | null } | null = null;

/**
 * Values from a shared link. They travel in the hash (#dados=...), which the
 * browser never sends to the server, so salaries don't end up in access logs.
 * The hash is removed from the address bar right after the mount effects that
 * read it, so later edits aren't overwritten by the link on reload.
 */
export function readSharedState(): Record<string, unknown> | null {
  const url = new URL(window.location.href);
  if (cache?.hash === url.hash) return cache.data;

  const raw = new URLSearchParams(url.hash.slice(1)).get(PARAM);
  cache = { hash: url.hash, data: raw ? decode(raw) : null };
  if (raw) {
    queueMicrotask(() => {
      window.history.replaceState(window.history.state, '', url.pathname + url.search);
    });
  }
  return cache.data;
}

export function buildShareUrl(prefix: string): string {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(`${prefix}:`)) continue;
    try {
      data[key] = JSON.parse(localStorage.getItem(key) ?? 'null');
    } catch {
      // valor corrompido — fica fora do link
    }
  }
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = new URLSearchParams({ [PARAM]: encode(data) }).toString();
  return url.toString();
}
