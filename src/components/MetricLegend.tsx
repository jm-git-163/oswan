/** 하루 자극 기준(개) 안내 — 체중 비례 아님 */

import {
  DAILY_CORE_REPS,
  DAILY_LOWER_REPS,
  STIMULUS_BASIS_HINT,
  formatReps,
} from '../lib/estimates';

type Props = {
  compact?: boolean;
  reps?: number;
};

export function MetricLegend({ compact, reps }: Props) {
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
        {typeof reps === 'number' && (
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
            오늘 {Math.round(reps)}개
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
          하체 참고 {formatReps(DAILY_LOWER_REPS)}
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
        하루 하체 참고 목표 {formatReps(DAILY_LOWER_REPS)}
      </div>
      <p className="meta" style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.5 }}>
        {STIMULUS_BASIS_HINT} 코어는 약 {formatReps(DAILY_CORE_REPS)}을 참고해요.
      </p>
    </div>
  );
}
