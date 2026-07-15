import type { CSSProperties } from 'react';
import type { CheerCue } from '../lib/sessionCoach';

type Props = {
  cue: CheerCue | null;
  /** Remount key so animation restarts each rep */
  flashKey: number;
};

const TONE: Record<CheerCue['tone'], { fg: string; glow: string; bar: string }> = {
  go: {
    fg: '#FFFFFF',
    glow: 'rgba(255,255,255,0.55)',
    bar: 'rgba(255,255,255,0.85)',
  },
  mid: {
    fg: '#C8F54A',
    glow: 'rgba(200,245,74,0.55)',
    bar: '#C8F54A',
  },
  hot: {
    fg: '#FFE566',
    glow: 'rgba(255,229,102,0.65)',
    bar: '#FFE566',
  },
  finish: {
    fg: '#FFFFFF',
    glow: 'rgba(200,245,74,0.85)',
    bar: '#C8F54A',
  },
};

/** Full-bleed pop cheer — readable while squatting away from the phone. */
export function CheerBurst({ cue, flashKey }: Props) {
  if (!cue) return null;
  const t = TONE[cue.tone];
  const style = {
    '--cheer-fg': t.fg,
    '--cheer-glow': t.glow,
    '--cheer-bar': t.bar,
  } as CSSProperties;

  return (
    <div key={flashKey} className="cheer-burst" aria-live="polite" style={style}>
      <div className="cheer-burst__flash" />
      <div className="cheer-burst__panel">
        <div className="cheer-burst__bar" />
        <div className="cheer-burst__text">{cue.line}</div>
        <div className="cheer-burst__bar cheer-burst__bar--bottom" />
      </div>
    </div>
  );
}
