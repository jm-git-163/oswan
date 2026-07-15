/** Last chosen squat target for FAB / session entry. */
const KEY = 'oswan_last_target';

export function getLastTarget(fallback = 30): number {
  try {
    const n = Number(localStorage.getItem(KEY));
    if (Number.isFinite(n) && n >= 5 && n <= 200) return Math.round(n);
  } catch {
    /* ignore */
  }
  return fallback;
}

export function setLastTarget(n: number): void {
  try {
    localStorage.setItem(KEY, String(Math.max(5, Math.min(200, Math.round(n)))));
  } catch {
    /* ignore */
  }
}
