/** 하루 자극 기준 — 실제 스쿼트 개수 = 하체 권장 단위 */

import {
  DAILY_CORE_REPS,
  DAILY_LOWER_REPS,
  STIMULUS_BASIS_HINT,
  formatReps,
  lowerGoalProgress,
} from '../lib/estimates';

type Props = {
  compact?: boolean;
  reps?: number;
};

export function MetricLegend({ compact, reps }: Props) {
  const progress = typeof reps === 'number' ? lowerGoalProgress(reps) : null;

  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          alignItems: 'center',
        }}
      >
        {progress && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.08)',
              whiteSpace: 'nowrap',
            }}
          >
            오늘 스쿼트 {progress.current}개
          </span>
        )}
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 999,
            background: 'rgba(200,245,74,0.14)',
            color: 'var(--accent)',
            whiteSpace: 'nowrap',
          }}
        >
          하체 권장 {formatReps(DAILY_LOWER_REPS)}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 16,
        border: '1px solid rgba(200,245,74,0.22)',
        background: 'rgba(200,245,74,0.06)',
        wordBreak: 'keep-all',
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.4 }}>
        권장 하체 자극 = 스쿼트 {formatReps(DAILY_LOWER_REPS)}
      </div>
      <p className="meta" style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.5 }}>
        {STIMULUS_BASIS_HINT} 코어 참고는 약 {formatReps(DAILY_CORE_REPS)} 상당이에요.
      </p>
    </div>
  );
}
