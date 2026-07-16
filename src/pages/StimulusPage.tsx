import { Link, useNavigate } from 'react-router-dom';
import { BrandHeader } from '../components/BrandMark';
import { MetricLegend } from '../components/MetricLegend';
import { StimulusProgressDiagram } from '../components/StimulusProgressDiagram';
import { useHomeStats } from '../hooks/useHomeStats';
import {
  DAILY_CORE_REPS,
  STIMULUS_BASIS_HINT,
  STIMULUS_VS_REPS_HINT,
  buildStimulusCoach,
  coreGoalProgress,
  formatReps,
  lowerGoalProgress,
  stimulusLabel,
} from '../lib/estimates';
import { useAppStore } from '../store';

export function StimulusPage() {
  const user = useAppStore((s) => s.user)!;
  const navigate = useNavigate();
  const { reps, todayEst } = useHomeStats(user);
  const coach = buildStimulusCoach({
    kcal: todayEst.kcal,
    lowerBody: todayEst.lowerBody,
    core: todayEst.core,
    reps,
  });
  const lower = lowerGoalProgress(reps);
  const coreP = coreGoalProgress(reps);

  return (
    <div className="page page-enter">
      <BrandHeader size="sm" showTagline={false} />
      <button
        type="button"
        className="mute-link"
        style={{ display: 'block', marginTop: 8, textAlign: 'left' }}
        onClick={() => navigate(-1)}
      >
        ← 뒤로
      </button>

      <h1 className="page-title" style={{ marginTop: 16, fontSize: 28 }}>
        오늘의 자극
      </h1>
      <p className="meta" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
        숫자는 전부 <strong style={{ color: 'var(--text)' }}>스쿼트 개수</strong>예요. 권장 하체
        자극 = 하루 {formatReps(lower.goal)}.
      </p>

      <div style={{ marginTop: 16 }}>
        <MetricLegend />
      </div>

      <div style={{ marginTop: 14 }}>
        <StimulusProgressDiagram
          current={lower.current}
          goal={lower.goal}
          feel={stimulusLabel(todayEst.lowerBody)}
        />
      </div>

      <div
        style={{
          marginTop: 20,
          padding: '22px 20px',
          borderRadius: 20,
          background: 'linear-gradient(160deg, #1a2210, #121212)',
          border: '1px solid rgba(200,245,74,0.22)',
        }}
      >
        <div className="meta" style={{ fontSize: 12, marginBottom: 8 }}>
          {coach.headline}
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.4,
            wordBreak: 'keep-all',
            color: 'var(--accent)',
          }}
        >
          {coach.action}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginTop: 20,
        }}
      >
        <ScoreTile
          label="권장 하체 자극"
          current={lower.current}
          goal={lower.goal}
          feel={stimulusLabel(todayEst.lowerBody)}
          blurb={coach.meaningLower}
        />
        <ScoreTile
          label="코어 참고"
          current={coreP.current}
          goal={coreP.goal}
          feel={stimulusLabel(todayEst.core)}
          blurb={coach.meaningCore}
        />
      </div>

      <div className="surface-card" style={{ marginTop: 14, padding: 16 }}>
        <div className="meta" style={{ fontSize: 11, letterSpacing: '0.06em' }}>
          칼로리
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)', marginTop: 4 }}>
          약 {todayEst.kcal}
          <span style={{ fontSize: 14, fontWeight: 600, marginLeft: 6 }}>kcal</span>
        </div>
        <p className="meta" style={{ margin: '10px 0 0', fontSize: 13, lineHeight: 1.45 }}>
          스쿼트는 칼로리보다 자극이 동기가 됩니다. 칼로리만 체중을 반영해요.
        </p>
      </div>

      <div style={{ marginTop: 20, display: 'grid', gap: 10 }}>
        <GuideRow title="같은 단위" body={STIMULUS_BASIS_HINT} />
        <GuideRow title="질감 표시" body={STIMULUS_VS_REPS_HINT} />
        <GuideRow
          title="코어"
          body={`코어 참고 ${formatReps(DAILY_CORE_REPS)}은 스쿼트 상당치예요. 하체보다 천천히 찹니다.`}
        />
        <GuideRow
          title="의료 아님"
          body="근력·체성분 측정이 아닙니다. 개수 기반 참고용 추정이에요."
        />
      </div>

      <Link
        to={`/session?target=${Math.max(20, Math.min(50, lower.left > 0 ? lower.left : Math.round(reps || 30)))}`}
        className="cta-primary"
        style={{ marginTop: 28, display: 'flex', textAlign: 'center', justifyContent: 'center' }}
      >
        {coach.verdict === 'rest' || coach.verdict === 'done'
          ? '그래도 한 세트 더'
          : lower.left > 0
            ? `스쿼트 ${formatReps(Math.min(40, lower.left))} 이어서`
            : '이어서 스쿼트'}
      </Link>
      <Link to="/" className="cta-secondary" style={{ marginTop: 10, display: 'block', textAlign: 'center' }}>
        홈
      </Link>
    </div>
  );
}

function ScoreTile({
  label,
  current,
  goal,
  feel,
  blurb,
}: {
  label: string;
  current: number;
  goal: number;
  feel: string;
  blurb: string;
}) {
  const pct = Math.min(100, Math.max(0, (current / goal) * 100));
  return (
    <div className="surface-card" style={{ padding: 14 }}>
      <div className="meta" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
        {label} · {feel}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          marginTop: 4,
          letterSpacing: '-0.04em',
          whiteSpace: 'nowrap',
        }}
      >
        {formatReps(current)}
        <span className="meta" style={{ fontSize: 14, fontWeight: 600, marginLeft: 4 }}>
          / {formatReps(goal)}
        </span>
      </div>
      <div
        style={{
          marginTop: 12,
          height: 6,
          borderRadius: 999,
          background: 'var(--surface-3)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: current >= goal ? 'var(--accent)' : '#FFD23F',
            borderRadius: 999,
          }}
        />
      </div>
      <p className="meta" style={{ margin: '12px 0 0', fontSize: 11, lineHeight: 1.45 }}>
        {blurb}
      </p>
    </div>
  );
}

function GuideRow({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(4.5em, auto) 1fr',
        gap: 12,
        padding: '12px 4px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        wordBreak: 'keep-all',
      }}
    >
      <div
        style={{
          fontWeight: 800,
          fontSize: 13,
          color: 'var(--accent)',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </div>
      <div className="meta" style={{ fontSize: 13, lineHeight: 1.5, minWidth: 0 }}>
        {body}
      </div>
    </div>
  );
}
