const KEY = 'oswan.coachPrefs.v2';

export type CoachPrefs = {
  /** Session motivation BGM — default on; tap to mute. */
  music: boolean;
  /** On-screen + spoken cheer — default on; tap to mute. */
  cheer: boolean;
};

const DEFAULTS: CoachPrefs = { music: true, cheer: true };

export function getCoachPrefs(): CoachPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<CoachPrefs>;
    return {
      music: parsed.music !== false,
      cheer: parsed.cheer !== false,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setCoachPrefs(next: Partial<CoachPrefs>): CoachPrefs {
  const merged = { ...getCoachPrefs(), ...next };
  localStorage.setItem(KEY, JSON.stringify(merged));
  return merged;
}
