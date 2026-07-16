import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { StimulusProgressDiagram } from '../components/StimulusProgressDiagram';
import { backendStatus, fetchMyWeekStats, type DayStat } from '../lib/api';
import {
  DAILY_CORE_REPS,
  DAILY_LOWER_REPS,
  STIMULUS_BASIS_HINT,
  buildStimulusCoach,
  coreGoalProgress,
  estimateSession,
  estimateSessionsTotal,
  formatReps,
  lowerGoalProgress,
  stimulusLabel,
} from '../lib/estimates';
import { last7Days, listSessions, todayReps } from '../lib/storage';
import { useAppStore } from '../store';

export function HistoryPage() {
  const user = useAppStore((s) => s.user)!;
  const [remote, setRemote] = useState<DayStat[] | null>(null);
  const backend = backendStatus();

  useEffect(() => {
    if (backend !== 'on') return;
    fetchMyWeekStats(user.id).then(setRemote);
  }, [user.id, backend]);

  const bars = useMemo(() => {
    if (remote && remote.length > 0) {
      const map = new Map(remote.map((r) => [r.day, r.reps_sum]));
      const out: { label: string; reps: number }[] = [];
      const now = new Date();
      for (let i = 6; i >= 0; i -= 1) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        out.push({
          label: `${d.getMonth() + 1}/${d.getDate()}`,
          reps: map.get(key) ?? 0,
        });
      }
      return out;
    }
    return last7Days(user.id);
  }, [user.id, remote]);

  const sessions = useMemo(
    () => listSessions().filter((s) => s.softUserId === user.id).slice(0, 30),
    [user.id],
  );

  const todaySessions = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return sessions.filter((s) => +new Date(s.endedAt) >= +start);
  }, [sessions]);

  const weekSessions = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return sessions.filter((s) => +new Date(s.endedAt) >= +start);
  }, [sessions]);

  const todayRepsCount = useMemo(() => todayReps(user.id), [user.id, sessions]);
  const todayEst = useMemo(() => estimateSessionsTotal(todaySessions), [todaySessions]);
  const weekEst = useMemo(() => estimateSessionsTotal(weekSessions), [weekSessions]);
  const weekReps = useMemo(
    () => weekSessions.reduce((a, s) => a + s.reps, 0),
    [weekSessions],
  );

  const lower = lowerGoalProgress(todayRepsCount);
  const coreP = coreGoalProgress(todayRepsCount);
  const todayCoach = buildStimulusCoach({
    kcal: todayEst.kcal,
    lowerBody: todayEst.lowerBody,
    core: todayEst.core,
    reps: todayRepsCount,
  });

  const max = Math.max(1, ...bars.map((b) => b.reps));

  return (
    <div className="page">
      <h1 className="page-title">기록</h1>
      <p className="meta" style={{ marginBottom: 20, lineHeight: 1.5 }}>
        오늘 자극 · 최근 7일 · 세션
        {backend === 'on' ? ' · 동기화됨' : ' · 로컬'}
        {' · '}
        <Link to="/ranking" className="mute-link">
          랭킹
        </Link>
      </p>

      {/* —— 오늘 하체/코어 (홈에서 옮긴 내용) —— */}
      <section
        className="card"
        style={{
          marginBottom: 16,
          padding: 18,
          border: '1px solid rgba(200,245,74,0.22)',
          background: 'linear-gradient(165deg, rgba(200,245,74,0.07), transparent 55%)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <div>
            <div className="meta" style={{ fontSize: 11, letterSpacing: '0.06em' }}>
              오늘 자극
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4, letterSpacing: '-0.02em' }}>
              스쿼트 {formatReps(todayRepsCount)}
            </div>
          </div>
          <Link to="/stimulus" className="mute-link" style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
            쉬운 설명 →
          </Link>
        </div>

        {todayRepsCount > 0 ? (
          <>
            <div style={{ marginTop: 14 }}>
              <StimulusProgressDiagram
                current={lower.current}
                goal={lower.goal}
                feel={stimulusLabel(todayEst.lowerBody)}
              />
            </div>

            <p
              style={{
                marginTop: 14,
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--accent)',
                lineHeight: 1.4,
                wordBreak: 'keep-all',
              }}
            >
              {todayCoach.action}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                marginTop: 16,
              }}
            >
              <StatChip
                title="권장 하체 자극"
                value={`${lower.current}/${lower.goal}개`}
                sub={`질감 ${stimulusLabel(todayEst.lowerBody)}`}
                barPct={lower.pct}
              />
              <StatChip
                title="코어 참고"
                value={`${coreP.current}/${coreP.goal}개`}
                sub={`질감 ${stimulusLabel(todayEst.core)} · 상당치`}
                barPct={coreP.pct}
              />
            </div>

            <div
              style={{
                marginTop: 14,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span className="meta" style={{ fontSize: 13 }}>
                약 {todayEst.kcal} kcal · 참고용
              </span>
              <span className="meta" style={{ fontSize: 11 }}>
                하루 하체 권장 {formatReps(DAILY_LOWER_REPS)}
              </span>
            </div>
          </>
        ) : (
          <p className="meta" style={{ marginTop: 12, fontSize: 14, lineHeight: 1.5 }}>
            아직 오늘 스쿼트가 없어요. 홈에서 시작하면 여기에 하체·코어 진행이 쌓여요.
          </p>
        )}

        <p className="meta" style={{ marginTop: 12, fontSize: 12, lineHeight: 1.45 }}>
          {STIMULUS_BASIS_HINT}
        </p>
      </section>

      {/* —— 주간 —— */}
      <section className="card" style={{ marginBottom: 16, padding: 18 }}>
        <div className="meta" style={{ fontSize: 11, letterSpacing: '0.06em' }}>
          최근 7일
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, marginTop: 6 }}>
          주간 스쿼트 {formatReps(weekReps)}
        </div>
        <div className="meta" style={{ marginTop: 4, fontSize: 13 }}>
          합산 약 {weekEst.kcal} kcal · 하체 질감 {stimulusLabel(weekEst.lowerBody)} · 코어{' '}
          {stimulusLabel(weekEst.core)}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            height: 140,
            marginTop: 18,
          }}
        >
          {bars.map((b) => {
            const hit = b.reps >= DAILY_LOWER_REPS;
            return (
              <div key={b.label} style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
                <div
                  style={{
                    height: `${Math.max(4, (b.reps / max) * 100)}px`,
                    background: b.reps > 0 ? (hit ? 'var(--accent)' : '#FFD23F') : 'var(--surface-3)',
                    borderRadius: 8,
                    marginBottom: 8,
                    transition: 'height 0.3s',
                  }}
                />
                <div className="meta" style={{ fontSize: 10 }}>
                  {b.label}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>{b.reps}개</div>
              </div>
            );
          })}
        </div>
        <p className="meta" style={{ marginTop: 12, fontSize: 11, lineHeight: 1.4 }}>
          막대 높이 = 그날 실제 스쿼트 개수. 초록은 하루 하체 권장({formatReps(DAILY_LOWER_REPS)}) 이상.
        </p>
      </section>

      {/* —— 세션 목록 —— */}
      <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>세션</h2>
      <div style={{ display: 'grid', gap: 8 }}>
        {sessions.length === 0 && <div className="card meta">아직 세션이 없어요.</div>}
        {sessions.map((s) => {
          const est = estimateSession(s.reps, s.durationMs);
          return (
            <div
              key={s.id}
              className="card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                alignItems: 'flex-start',
                padding: 14,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>
                  {s.reps}개
                  <span className="meta" style={{ fontWeight: 600 }}>
                    {' '}
                    / 목표 {s.targetReps}개
                  </span>
                </div>
                <div className="meta" style={{ marginTop: 4, fontSize: 12 }}>
                  {new Date(s.endedAt).toLocaleString('ko-KR')}
                </div>
                <div className="meta" style={{ fontSize: 12, marginTop: 8, lineHeight: 1.4 }}>
                  약 {est.kcal} kcal · 하체 {stimulusLabel(est.lowerBody)} · 코어{' '}
                  {stimulusLabel(est.core)}
                </div>
              </div>
              <div
                style={{
                  flexShrink: 0,
                  color: s.cleared ? 'var(--accent)' : 'var(--text-tertiary)',
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                {s.cleared ? '오스완' : '미달'}
              </div>
            </div>
          );
        })}
      </div>

      <p className="meta" style={{ marginTop: 16, fontSize: 11, lineHeight: 1.45 }}>
        코어 참고 {formatReps(DAILY_CORE_REPS)}는 스쿼트 상당치예요. 의료·체성분 측정이 아닌 참고용입니다.
      </p>
    </div>
  );
}

function StatChip({
  title,
  value,
  sub,
  barPct,
}: {
  title: string;
  value: string;
  sub: string;
  barPct: number;
}) {
  const pct = Math.min(100, Math.max(0, barPct));
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 14,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="meta" style={{ fontSize: 11 }}>
        {title}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4, letterSpacing: '-0.03em' }}>{value}</div>
      <div
        style={{
          marginTop: 10,
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
            borderRadius: 999,
            background: pct >= 100 ? 'var(--accent)' : '#FFD23F',
          }}
        />
      </div>
      <div className="meta" style={{ fontSize: 11, marginTop: 6 }}>
        {sub}
      </div>
    </div>
  );
}
