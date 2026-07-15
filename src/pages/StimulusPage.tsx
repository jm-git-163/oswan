import { Link, useNavigate } from 'react-router-dom';
import { BrandHeader } from '../components/BrandMark';
import { MetricLegend } from '../components/MetricLegend';
import { useHomeStats } from '../hooks/useHomeStats';
import {
  CORE_STIM_GOAL,
  LOWER_STIM_GOAL,
  STIMULUS_VS_REPS_HINT,
  buildStimulusCoach,
  formatPts,
  formatReps,
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
        개수와 점수는 서로 다른 단위예요.
      </p>

      <div style={{ marginTop: 16 }}>
        <MetricLegend />
      </div>

      <div
        style={{
          marginTop: 14,
          padding: '14px 16px',
          borderRadius: 16,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div className="meta" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
          오늘 스쿼트 · 개수
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            marginTop: 4,
            letterSpacing: '-0.03em',
            whiteSpace: 'nowrap',
          }}
        >
          {formatReps(reps)}
        </div>
        <p className="meta" style={{ margin: '10px 0 0', fontSize: 12, lineHeight: 1.5 }}>
          {STIMULUS_VS_REPS_HINT}
        </p>
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
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.35,
            wordBreak: 'keep-all',
          }}
        >
          {coach.headline}
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--accent)',
            lineHeight: 1.45,
            wordBreak: 'keep-all',
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
          label="하체"
          score={todayEst.lowerBody}
          goal={LOWER_STIM_GOAL}
          blurb={coach.meaningLower}
        />
        <ScoreTile
          label="코어"
          score={todayEst.core}
          goal={CORE_STIM_GOAL}
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
          스쿼트는 칼로리보다 자극이 동기가 됩니다. 숫자는 참고용이에요.
        </p>
      </div>

      <div
        style={{
          marginTop: 20,
          display: 'grid',
          gap: 10,
        }}
      >
        <GuideRow
          title="자극 점수"
          body={`하체 ${formatPts(LOWER_STIM_GOAL)}+ · 코어 ${formatPts(CORE_STIM_GOAL)}+ (0~100점). 하루 ‘괜찮은 자극’ 기준`}
        />
        <GuideRow title="개수 ≠ 점수" body={STIMULUS_VS_REPS_HINT} />
        <GuideRow
          title="의료 아님"
          body="근력·체성분 측정이 아닙니다. 개수와 밀도로 만든 추정이에요."
        />
      </div>

      <Link
        to={`/session?target=${Math.max(20, Math.min(50, Math.round(reps || 30)))}`}
        className="cta-primary"
        style={{ marginTop: 28, display: 'flex', textAlign: 'center', justifyContent: 'center' }}
      >
        {coach.verdict === 'rest' || coach.verdict === 'done'
          ? '그래도 한 세트 더'
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
  score,
  goal,
  blurb,
}: {
  label: string;
  score: number;
  goal: number;
  blurb: string;
}) {
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div className="surface-card" style={{ padding: 14 }}>
      <div className="meta" style={{ fontSize: 11 }}>
        {label} · 자극 {formatPts(goal)}+
      </div>
      <div
        style={{
          fontSize: 36,
          fontWeight: 800,
          marginTop: 4,
          letterSpacing: '-0.04em',
          whiteSpace: 'nowrap',
        }}
      >
        {formatPts(score)}
        <span className="meta" style={{ fontSize: 13, fontWeight: 600, marginLeft: 6 }}>
          {stimulusLabel(score)}
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
            background: score >= goal ? 'var(--accent)' : '#FFD23F',
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
