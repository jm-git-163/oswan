import {
  DAILY_CORE_REPS,
  DAILY_LOWER_REPS,
  estimateSession,
  buildStimulusCoach,
  coreGoalProgress,
  formatReps,
  lowerGoalProgress,
  stimulusLabel,
  type SessionEstimates as Estimates,
} from '../lib/estimates';

type Props = {
  reps: number;
  durationMs: number;
  /** 오늘 이미 한 개수(이번 세트 제외). 있으면 하루 권장까지 남음 표시 */
  todayRepsBefore?: number;
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
            background: 'var(--accent)',
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

export function SessionEstimatesCard({ reps, durationMs, todayRepsBefore = 0, compact }: Props) {
  const e: Estimates = estimateSession(reps, durationMs);
  const dayReps = todayRepsBefore + reps;
  const lower = lowerGoalProgress(dayReps);
  const coreP = coreGoalProgress(dayReps);

  if (compact) {
    return (
      <div className="meta" style={{ fontSize: 12, marginTop: 6, wordBreak: 'keep-all' }}>
        약 {e.kcal} kcal · 오늘 스쿼트 {formatReps(dayReps)} · 하체 권장 {formatReps(DAILY_LOWER_REPS)} ·{' '}
        {stimulusLabel(e.lowerBody)}
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
          권장 하체 = 스쿼트 {formatReps(DAILY_LOWER_REPS)}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
        <Bar
          label="권장 하체 자극"
          current={lower.current}
          goal={lower.goal}
          hint={
            lower.left > 0
              ? `오늘 ${formatReps(dayReps)} · 권장까지 스쿼트 ${formatReps(lower.left)}만 더 · 질감 ${stimulusLabel(e.lowerBody)}`
              : `권장 하체 자극 도달 · 질감 ${stimulusLabel(e.lowerBody)}`
          }
        />
        <Bar
          label="코어 참고"
          current={coreP.current}
          goal={coreP.goal}
          hint={`스쿼트 상당 · 하루 ${formatReps(DAILY_CORE_REPS)} · 질감 ${stimulusLabel(e.core)}`}
        />
      </div>

      <p className="meta" style={{ fontSize: 11, marginTop: 14, lineHeight: 1.45 }}>
        {(() => {
          const c = buildStimulusCoach({
            kcal: e.kcal,
            lowerBody: e.lowerBody,
            core: e.core,
            reps: dayReps,
          });
          return `${c.headline} · ${c.action}`;
        })()}
      </p>
    </div>
  );
}
