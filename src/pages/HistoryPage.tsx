import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { backendStatus, fetchMyWeekStats, type DayStat } from '../lib/api';
import { estimateSession, estimateSessionsTotal, buildStimulusCoach, stimulusLabel, lowerRepEquiv, coreRepEquiv, DAILY_LOWER_REPS, DAILY_CORE_REPS, formatRepShare } from '../lib/estimates';
import { last7Days, listSessions } from '../lib/storage';
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
  const weekSessions = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return sessions.filter((s) => +new Date(s.endedAt) >= +start);
  }, [sessions]);
  const weekEst = useMemo(() => estimateSessionsTotal(weekSessions), [weekSessions]);
  const max = Math.max(1, ...bars.map((b) => b.reps));

  return (
    <div className="page">
      <h1 className="page-title">기록</h1>
      <p className="meta" style={{ marginBottom: 24 }}>
        최근 7일
        {backend === 'on' ? ' · 동기화됨' : ' · 로컬'}
        {' · '}
        <Link to="/ranking" className="mute-link">
          랭킹
        </Link>
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="meta">최근 7일 추정</div>
        {(() => {
          const weekReps = weekSessions.reduce((a, s) => a + s.reps, 0);
          const coach = buildStimulusCoach({
            kcal: weekEst.kcal,
            lowerBody: weekEst.lowerBody,
            core: weekEst.core,
            reps: weekReps,
          });
          return (
            <>
              <div
                style={{
                  marginTop: 12,
                  fontSize: 17,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.35,
                }}
              >
                {coach.headline}
              </div>
              <div style={{ marginTop: 6, color: 'var(--accent)', fontWeight: 700, fontSize: 14 }}>
                {coach.action}
              </div>
            </>
          );
        })()}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 10,
            marginTop: 16,
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>
              약 {weekEst.kcal}
            </div>
            <div className="meta" style={{ fontSize: 11, marginTop: 4 }}>
              kcal
            </div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>
              {stimulusLabel(weekEst.lowerBody)}
            </div>
            <div className="meta" style={{ fontSize: 11, marginTop: 4 }}>
              하체 · {formatRepShare(lowerRepEquiv(weekEst.lowerBody))}/{formatRepShare(DAILY_LOWER_REPS)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>
              {stimulusLabel(weekEst.core)}
            </div>
            <div className="meta" style={{ fontSize: 11, marginTop: 4 }}>
              코어 · {formatRepShare(coreRepEquiv(weekEst.core))}/{formatRepShare(DAILY_CORE_REPS)}
            </div>
          </div>
        </div>
        <p className="meta" style={{ fontSize: 11, marginTop: 12, lineHeight: 1.4 }}>
          칼로리는 합산, 하체·코어는 세션 평균 자극(개분). 하루 하체 {formatRepShare(DAILY_LOWER_REPS)} · 막대는 실제 스쿼트 개수
        </p>
      </div>

      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          height: 160,
          marginBottom: 24,
        }}
      >
        {bars.map((b) => (
          <div key={b.label} style={{ flex: 1, textAlign: 'center' }}>
            <div
              style={{
                height: `${Math.max(4, (b.reps / max) * 110)}px`,
                background: b.reps > 0 ? 'var(--accent)' : 'var(--surface-3)',
                borderRadius: 8,
                marginBottom: 8,
                transition: 'height 0.3s',
              }}
            />
            <div className="meta" style={{ fontSize: 10 }}>
              {b.label}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2 }}>{b.reps}개</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {sessions.length === 0 && <div className="card meta">아직 세션이 없어요.</div>}
        {sessions.map((s) => {
          const est = estimateSession(s.reps, s.durationMs);
          return (
            <div key={s.id} className="card" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700 }}>
                  {s.reps}개
                  <span className="meta"> / {s.targetReps}개</span>
                </div>
                <div className="meta" style={{ marginTop: 4 }}>
                  {new Date(s.endedAt).toLocaleString('ko-KR')}
                </div>
                <div className="meta" style={{ fontSize: 12, marginTop: 6 }}>
                  {(() => {
                    const c = buildStimulusCoach({
                      kcal: est.kcal,
                      lowerBody: est.lowerBody,
                      core: est.core,
                      reps: s.reps,
                    });
                    return `${c.headline} · 하체 ${formatRepShare(lowerRepEquiv(est.lowerBody))}/${formatRepShare(DAILY_LOWER_REPS)} · 코어 ${formatRepShare(coreRepEquiv(est.core))}/${formatRepShare(DAILY_CORE_REPS)}`;
                  })()}
                </div>
              </div>
              <div
                style={{
                  color: s.cleared ? 'var(--accent)' : 'var(--text-tertiary)',
                  fontWeight: 700,
                }}
              >
                {s.cleared ? '오스완' : '미달'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
