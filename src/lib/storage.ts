const mem: Record<string, string> = {};
export function safeGet(key: string): string | null {
  try { if (typeof window !== "undefined" && window.localStorage) return window.localStorage.getItem(key); } catch { /* fall through */ }
  return mem[key] ?? null;
}
export function safeSet(key: string, value: string) {
  mem[key] = value;
  try { if (typeof window !== "undefined" && window.localStorage) window.localStorage.setItem(key, value); } catch { /* memory only */ }
}
export function safeRemove(key: string) {
  delete mem[key];
  try { if (typeof window !== "undefined" && window.localStorage) window.localStorage.removeItem(key); } catch { /* ignore */ }
}
export function loadJSON<T>(key: string, version: number): T | null {
  try {
    const raw = safeGet(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { v?: number; data?: T };
    if (!parsed || parsed.v !== version || !parsed.data) return null;
    return parsed.data;
  } catch { return null; }
}
export function saveJSON<T>(key: string, version: number, data: T) {
  try { safeSet(key, JSON.stringify({ v: version, data })); } catch { /* ignore */ }
}
