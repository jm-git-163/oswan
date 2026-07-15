import {
  DAILY_CORE_REPS,
  DAILY_LOWER_REPS,
  estimateSession,
  buildStimulusCoach,
  coreRepEquiv,
  formatReps,
  lowerRepEquiv,
  stimulusLabel,
  type SessionEstimates as Estimates,
} from '../lib/estimates';

type Props = {
  reps: number;
  durationMs: number;
  compact?: boolean;
};

function Bar({
  label,
  current,
  goal,
  hint,
}: {
  label: string;
  current: number;
  goal: number;
  hint: string;
}) {
  const pct = Math.min(100, Math.max(0, (current / goal) * 100));
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 6,
          gap: 8,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
        <span className="meta" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
          {formatReps(current)} / {formatReps(goal)}
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
            width: `${pct}%`,
            height: '100%',
            borderRadius: 999,
            background: current >= goal ? 'var(--accent)' : 'var(--accent)',
            transition: 'width 0.4s ease',
            opacity: current >= goal ? 1 : 0.85,
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
  const lowerEq = lowerRepEquiv(e.lowerBody);
  const coreEq = coreRepEquiv(e.core);

  if (compact) {
    return (
      <div className="meta" style={{ fontSize: 12, marginTop: 6, wordBreak: 'keep-all' }}>
        약 {e.kcal} kcal · 하체 {stimulusLabel(e.lowerBody)} {formatReps(lowerEq)} · 코어{' '}
        {stimulusLabel(e.core)} {formatReps(coreEq)}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 12 }}>
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
          하루 하체 {formatReps(DAILY_LOWER_REPS)}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
        <Bar
          label="하체 자극"
          current={lowerEq}
          goal={DAILY_LOWER_REPS}
          hint={`허벅지·엉덩이 · 하루 ${formatReps(DAILY_LOWER_REPS)}이면 OK`}
        />
        <Bar
          label="코어 자극"
          current={coreEq}
          goal={DAILY_CORE_REPS}
          hint={`배·허리 · 하루 ${formatReps(DAILY_CORE_REPS)}이면 OK`}
        />
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
