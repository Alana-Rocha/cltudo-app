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

// Keyed by the query string it was parsed from, so every hook mounting on
// the same URL reads the same values and a later navigation re-parses.
let cache: { search: string; data: Record<string, unknown> | null } | null = null;

/**
 * Values from a shared link. The param is removed from the address bar right
 * after the mount effects that read it, so later edits aren't overwritten by
 * the link on reload.
 */
export function readSharedState(): Record<string, unknown> | null {
  const url = new URL(window.location.href);
  if (cache?.search === url.search) return cache.data;

  const raw = url.searchParams.get(PARAM);
  cache = { search: url.search, data: raw ? decode(raw) : null };
  if (raw) {
    queueMicrotask(() => {
      url.searchParams.delete(PARAM);
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
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
  url.hash = '';
  url.searchParams.set(PARAM, encode(data));
  return url.toString();
}
