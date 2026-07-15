import {
  estimateSession,
  buildStimulusCoach,
  stimulusLabel,
  type SessionEstimates as Estimates,
} from '../lib/estimates';

type Props = {
  reps: number;
  durationMs: number;
  compact?: boolean;
};

function Bar({ label, score, hint }: { label: string; score: number; hint: string }) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
        <span className="meta" style={{ fontSize: 12 }}>
          {stimulusLabel(score)} · {score}
        </span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 999,
          background: 'var(--surface-3)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: '100%',
            borderRadius: 999,
            background: 'var(--accent)',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      <div className="meta" style={{ fontSize: 11, marginTop: 4 }}>
        {hint}
      </div>
    </div>
  );
}

export function SessionEstimatesCard({ reps, durationMs, compact }: Props) {
  const e: Estimates = estimateSession(reps, durationMs);

  if (compact) {
    return (
      <div className="meta" style={{ fontSize: 12, marginTop: 6 }}>
        약 {e.kcal} kcal · 하체 {stimulusLabel(e.lowerBody)} {e.lowerBody} · 코어{' '}
        {stimulusLabel(e.core)} {e.core}
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 20,
        paddingTop: 16,
        borderTop: '1px solid rgba(200,245,74,0.12)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
        <div>
          <div className="meta" style={{ letterSpacing: '0.06em', fontSize: 11 }}>
            추정 소모
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 2, color: 'var(--accent)' }}>
            약 {e.kcal}
            <span style={{ fontSize: 14, fontWeight: 600, marginLeft: 4 }}>kcal</span>
          </div>
        </div>
        <div className="meta" style={{ fontSize: 11, textAlign: 'right', lineHeight: 1.4 }}>
          {e.weightKg}kg 기준
          {e.usedDefaultWeight ? ' (기본)' : ''}
          <br />
          목표: 하체 55+ · 코어 40+
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
        <Bar label="하체 자극" score={e.lowerBody} hint="허벅지·엉덩이 · 0~100 참고 점수" />
        <Bar label="코어 자극" score={e.core} hint="배·허리 버티기 · 보통 하체보다 낮음" />
      </div>

      <p className="meta" style={{ fontSize: 11, marginTop: 14, lineHeight: 1.45 }}>
        {(() => {
          const c = buildStimulusCoach({
            kcal: e.kcal,
            lowerBody: e.lowerBody,
            core: e.core,
            reps,
          });
          return `${c.headline} · ${c.action}`;
        })()}
      </p>
    </div>
  );
}
