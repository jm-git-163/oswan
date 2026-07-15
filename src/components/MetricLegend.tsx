/** 스쿼트 개수(개) vs 자극 점수(점) — 단위가 한 덩어리로 보이게 */

import type { CSSProperties } from 'react';

type Props = {
  compact?: boolean;
  /** 오늘 개수 — compact일 때 옆에 숫자 표시 */
  reps?: number;
};

const keepWord: CSSProperties = {
  wordBreak: 'keep-all',
  overflowWrap: 'break-word',
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
              color: 'var(--text)',
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
          아래는 자극 점수
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
        ...keepWord,
      }}
    >
      <LegendTile
        badge="개수"
        example="예: 30개"
        body="스쿼트를 몇 번 했는지"
        tone="reps"
      />
      <LegendTile
        badge="점수"
        example="예: 55점"
        body="하체·코어 세기 0~100"
        tone="score"
      />
    </div>
  );
}

function LegendTile({
  badge,
  example,
  body,
  tone,
}: {
  badge: string;
  example: string;
  body: string;
  tone: 'reps' | 'score';
}) {
  const accent = tone === 'score';
  return (
    <div
      style={{
        padding: '14px 12px',
        borderRadius: 14,
        border: accent
          ? '1px solid rgba(200,245,74,0.28)'
          : '1px solid rgba(255,255,255,0.1)',
        background: accent ? 'rgba(200,245,74,0.06)' : 'rgba(255,255,255,0.04)',
        minWidth: 0,
        ...keepWord,
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 900,
          letterSpacing: '-0.02em',
          color: accent ? 'var(--accent)' : 'var(--text)',
          whiteSpace: 'nowrap',
        }}
      >
        {badge}
      </div>
      <div
        className="meta"
        style={{
          fontSize: 12,
          fontWeight: 700,
          marginTop: 6,
          color: 'var(--text-secondary)',
          whiteSpace: 'nowrap',
        }}
      >
        {example}
      </div>
      <div className="meta" style={{ fontSize: 11, lineHeight: 1.45, marginTop: 8, ...keepWord }}>
        {body}
      </div>
    </div>
  );
}
