import { formatReps } from '../lib/estimates';

type Props = {
  current: number;
  goal: number;
  feel?: string;
  compact?: boolean;
};

/**
 * 한 눈에: 오늘 스쿼트 → 권장 하체 자극 (같은 ‘개’ 단위)
 */
export function StimulusProgressDiagram({ current, goal, feel, compact }: Props) {
  const cur = Math.max(0, Math.round(current));
  const g = Math.max(1, Math.round(goal));
  const left = Math.max(0, g - cur);
  const pct = Math.min(100, Math.round((cur / g) * 100));
  const done = left === 0;

  return (
    <div
      style={{
        padding: compact ? '12px 14px' : '16px 16px',
        borderRadius: 16,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        wordBreak: 'keep-all',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <Node
          title="오늘 스쿼트"
          value={formatReps(cur)}
          accent={false}
        />
        <Arrow />
        <Node
          title="권장 하체 자극"
          value={formatReps(g)}
          accent
        />
      </div>

      <div
        style={{
          marginTop: compact ? 12 : 14,
          height: compact ? 10 : 12,
          borderRadius: 999,
          background: 'var(--surface-3)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 999,
            background: done ? 'var(--accent)' : '#FFD23F',
            transition: 'width 0.35s ease',
          }}
        />
      </div>

      <div
        style={{
          marginTop: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 8,
          fontSize: compact ? 12 : 13,
        }}
      >
        <span style={{ fontWeight: 800 }}>
          {cur}
          <span className="meta" style={{ fontWeight: 600 }}>
            {' '}
            / {g}개
          </span>
        </span>
        <span
          style={{
            fontWeight: 700,
            color: done ? 'var(--accent)' : '#FFD23F',
            textAlign: 'right',
          }}
        >
          {done
            ? '권장 하체 자극 도달'
            : `권장 하체 자극까지 스쿼트 ${formatReps(left)}만 더`}
        </span>
      </div>

      {feel && !compact && (
        <p className="meta" style={{ margin: '10px 0 0', fontSize: 12, lineHeight: 1.45 }}>
          질감 {feel} · 남은 개수는 오늘 한 스쿼트 개수 기준이에요 (환산 없음).
        </p>
      )}
    </div>
  );
}

function Node({
  title,
  value,
  accent,
}: {
  title: string;
  value: string;
  accent: boolean;
}) {
  return (
    <div style={{ minWidth: 0, flex: '1 1 100px' }}>
      <div className="meta" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
        {title}
      </div>
      <div
        style={{
          marginTop: 2,
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: accent ? 'var(--accent)' : 'inherit',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <div
      aria-hidden
      style={{
        flex: '0 0 auto',
        paddingTop: 14,
        color: 'var(--accent)',
        fontWeight: 800,
        fontSize: 18,
        opacity: 0.85,
      }}
    >
      →
    </div>
  );
}
