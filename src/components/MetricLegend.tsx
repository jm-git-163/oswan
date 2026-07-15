/** 스쿼트 개수(개) vs 자극 점수(점) 구분용 범례 */

type Props = {
  compact?: boolean;
  /** 오늘 개수 — compact일 때 옆에 숫자 표시 */
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
              padding: '3px 8px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.08)',
              color: 'var(--text)',
            }}
          >
            오늘 {Math.round(reps)}개
          </span>
        )}
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 999,
            background: 'rgba(200,245,74,0.14)',
            color: 'var(--accent)',
          }}
        >
          아래는 자극 점수(점)
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
      }}
    >
      <LegendTile
        unit="개"
        title="스쿼트 개수"
        body="몇 번 앉았다 일어났는지"
        tone="reps"
      />
      <LegendTile
        unit="점"
        title="자극 점수"
        body="하체·코어 세기 (0~100)"
        tone="score"
      />
    </div>
  );
}

function LegendTile({
  unit,
  title,
  body,
  tone,
}: {
  unit: string;
  title: string;
  body: string;
  tone: 'reps' | 'score';
}) {
  const accent = tone === 'score';
  return (
    <div
      style={{
        padding: '12px 12px',
        borderRadius: 14,
        border: accent
          ? '1px solid rgba(200,245,74,0.28)'
          : '1px solid rgba(255,255,255,0.1)',
        background: accent ? 'rgba(200,245,74,0.06)' : 'rgba(255,255,255,0.04)',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: accent ? 'var(--accent)' : 'var(--text)',
          }}
        >
          {unit}
        </span>
        <span style={{ fontSize: 12, fontWeight: 800 }}>{title}</span>
      </div>
      <div className="meta" style={{ fontSize: 11, lineHeight: 1.4 }}>
        {body}
      </div>
    </div>
  );
}
