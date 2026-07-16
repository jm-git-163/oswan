import { Link } from 'react-router-dom';
import { MetricLegend } from './MetricLegend';
import { StimulusProgressDiagram } from './StimulusProgressDiagram';
import {
  buildStimulusCoach,
  coreGoalProgress,
  formatReps,
  lowerGoalProgress,
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
  go: 'rgba(200,245,74,0.16)',
  push: 'rgba(255,210,63,0.16)',
  done: 'rgba(200,245,74,0.2)',
  rest: 'rgba(120,180,255,0.16)',
};

const VERDICT_FG: Record<StimulusVerdict, string> = {
  go: 'var(--accent)',
  push: '#FFD23F',
  done: 'var(--accent)',
  rest: '#8EC5FF',
};

const VERDICT_TAG: Record<StimulusVerdict, string> = {
  go: '더 해보자',
  push: '조금만 더',
  done: '자극 도달',
  rest: '잘했어요',
};

/** 홈 자극 카드 — 하체 진행 = 실제 스쿼트 개수 */
export function TodayEstimatesCard({ kcal, lowerBody, core, reps }: Props) {
  if (reps <= 0) return null;

  const coach = buildStimulusCoach({ kcal, lowerBody, core, reps });
  const lower = lowerGoalProgress(reps);
  const coreP = coreGoalProgress(reps);

  return (
    <Link
      to="/stimulus"
      className="surface-card"
      style={{
        display: 'block',
        marginBottom: 14,
        textDecoration: 'none',
        color: 'inherit',
        padding: 18,
        border: '1px solid rgba(200,245,74,0.28)',
        background: 'linear-gradient(165deg, rgba(200,245,74,0.08), transparent 55%)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.06em',
            color: VERDICT_FG[coach.verdict],
            background: VERDICT_TINT[coach.verdict],
            padding: '4px 10px',
            borderRadius: 999,
          }}
        >
          {VERDICT_TAG[coach.verdict]}
        </span>
        <span className="meta" style={{ fontSize: 11 }}>
          오늘의 자극
        </span>
      </div>

      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--accent)',
          lineHeight: 1.4,
          wordBreak: 'keep-all',
        }}
      >
        {coach.action}
      </div>

      <div style={{ marginTop: 14 }}>
        <StimulusProgressDiagram
          current={lower.current}
          goal={lower.goal}
          feel={stimulusLabel(lowerBody)}
          compact
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <MetricLegend compact reps={reps} />
      </div>

      <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
        <GoalBar
          label="권장 하체 자극"
          current={lower.current}
          goal={lower.goal}
          feel={stimulusLabel(lowerBody)}
          unitHint="스쿼트 개수"
        />
        <GoalBar
          label="코어 참고"
          current={coreP.current}
          goal={coreP.goal}
          feel={stimulusLabel(core)}
          unitHint="스쿼트 상당"
        />
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
        <span>약 {kcal} kcal · 참고용</span>
        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>쉬운 설명 →</span>
      </div>
    </Link>
  );
}

function GoalBar({
  label,
  current,
  goal,
  feel,
  unitHint,
}: {
  label: string;
  current: number;
  goal: number;
  feel: string;
  unitHint: string;
}) {
  const pct = Math.min(100, Math.max(0, (current / goal) * 100));
  const gap = Math.max(0, goal - current);
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
        <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
          {label}{' '}
          <span className="meta" style={{ fontWeight: 600 }}>
            {feel}
          </span>
        </span>
        <span style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>
          {formatReps(current)}
          <span className="meta" style={{ fontWeight: 600 }}>
            {' '}
            / {formatReps(goal)}
          </span>
        </span>
      </div>
      <div
        style={{
          height: 10,
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
            background: current >= goal ? 'var(--accent)' : '#FFD23F',
            transition: 'width 0.35s ease',
          }}
        />
      </div>
      <div className="meta" style={{ fontSize: 11, marginTop: 4 }}>
        {gap > 0
          ? `${unitHint} · ${formatReps(gap)} 남음`
          : `${unitHint} · 하루 권장 OK`}
      </div>
    </div>
  );
}
