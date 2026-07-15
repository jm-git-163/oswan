import { Link } from 'react-router-dom';
import {
  buildStimulusCoach,
  stimulusLabel,
  type StimulusVerdict,
} from '../lib/estimates';

type Props = {
  kcal: number;
  lowerBody: number;
  core: number;
  reps: number;
};

const VERDICT_TINT: Record<StimulusVerdict, string> = {
  go: 'rgba(200,245,74,0.14)',
  push: 'rgba(255,210,63,0.14)',
  done: 'rgba(200,245,74,0.18)',
  rest: 'rgba(120,180,255,0.14)',
};

const VERDICT_FG: Record<StimulusVerdict, string> = {
  go: 'var(--accent)',
  push: '#FFD23F',
  done: 'var(--accent)',
  rest: '#8EC5FF',
};

/** Compact home card — punchline + bars; detail on /stimulus */
export function TodayEstimatesCard({ kcal, lowerBody, core, reps }: Props) {
  if (reps <= 0) return null;

  const coach = buildStimulusCoach({ kcal, lowerBody, core, reps });

  return (
    <Link
      to="/stimulus"
      className="surface-card"
      style={{
        display: 'block',
        marginBottom: 14,
        textDecoration: 'none',
        color: 'inherit',
        padding: 16,
      }}
    >
      <div
        style={{
          display: 'inline-block',
          padding: '6px 12px',
          borderRadius: 10,
          background: VERDICT_TINT[coach.verdict],
          color: VERDICT_FG[coach.verdict],
          fontWeight: 800,
          fontSize: 15,
          letterSpacing: '-0.02em',
        }}
      >
        {coach.headline}
      </div>
      <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>
        {coach.action}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 10,
          marginTop: 16,
        }}
      >
        <Stat tip="kcal" value={`약 ${kcal}`} />
        <Stat tip="하체" value={`${stimulusLabel(lowerBody)} ${lowerBody}`} accent />
        <Stat tip="코어" value={`${stimulusLabel(core)} ${core}`} accent />
      </div>

      <div
        className="meta"
        style={{
          marginTop: 14,
          fontSize: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>의미 · 목표 감각</span>
        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>자세히 →</span>
      </div>
    </Link>
  );
}

function Stat({ tip, value, accent }: { tip: string; value: string; accent?: boolean }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '10px 6px',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.04)',
      }}
    >
      <div className="meta" style={{ fontSize: 10, marginBottom: 4 }}>
        {tip}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: accent ? 'var(--accent)' : 'var(--text)',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>
    </div>
  );
}
