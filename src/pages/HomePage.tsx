import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearStreak, createChallenge, listChallenges, todayReps } from '../lib/storage';
import { useAppStore } from '../store';

export function HomePage() {
  const user = useAppStore((s) => s.user)!;
  const navigate = useNavigate();
  const location = useLocation();
  const [target, setTarget] = useState(30);
  const reps = useMemo(() => todayReps(user.id), [user.id, location.key]);
  const streak = useMemo(() => clearStreak(user.id), [user.id, location.key]);
  const active = useMemo(
    () =>
      listChallenges().find(
        (c) =>
          (c.status === 'open' || c.status === 'accepted') &&
          (c.fromSoftUserId === user.id || c.toSoftUserId === user.id),
      ),
    [user.id, location.key],
  );

  return (
    <div className="page">
      <p className="meta" style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Oswan
      </p>
      <h1 className="page-title" style={{ marginTop: 4 }}>
        오스완
      </h1>

      <div style={{ marginTop: 48, marginBottom: 8 }}>
        <div className="hero-num" style={{ fontSize: 72 }}>
          {reps}
        </div>
        <div className="meta" style={{ marginTop: 8 }}>
          오늘 개수
        </div>
        <div style={{ marginTop: 10, color: 'var(--accent)', fontWeight: 600, fontSize: 14 }}>
          {streak > 0 ? `▸ ${streak}일 연속 오스완` : '▸ 오늘 목표를 채우면 오스완'}
        </div>
      </div>

      <p className="meta" style={{ fontSize: 15, margin: '28px 0 20px', lineHeight: 1.5 }}>
        목표 채우면 오스완.
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="meta" style={{ marginBottom: 10 }}>
          오늘 목표
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="cta-secondary"
            style={{ width: 48, padding: 10 }}
            onClick={() => setTarget((t) => Math.max(5, t - 5))}
          >
            −
          </button>
          <div className="hero-num" style={{ flex: 1, textAlign: 'center', fontSize: 40 }}>
            {target}
          </div>
          <button
            className="cta-secondary"
            style={{ width: 48, padding: 10 }}
            onClick={() => setTarget((t) => Math.min(200, t + 5))}
          >
            +
          </button>
        </div>
      </div>

      <button className="cta-primary" onClick={() => navigate(`/session?target=${target}`)}>
        스쿼트 시작
      </button>

      {active && (
        <Link
          to={`/c/${active.id}`}
          className="card"
          style={{ display: 'block', marginTop: 16, borderLeft: '3px solid var(--accent)' }}
        >
          <div className="meta">활성 도전</div>
          <div style={{ fontWeight: 600, marginTop: 6 }}>
            {active.targetReps}개 · {active.fromNickname}
            {active.toNickname ? ` vs ${active.toNickname}` : ''}
          </div>
        </Link>
      )}

      <button
        className="cta-secondary"
        style={{ marginTop: 12 }}
        onClick={() => navigate(`/practice?target=${target}`)}
      >
        연습 모드 (카메라 없음)
      </button>

      <button
        className="cta-secondary"
        style={{ marginTop: 12 }}
        onClick={() => {
          const c = createChallenge({
            fromSoftUserId: user.id,
            fromNickname: user.nickname,
            targetReps: target,
          });
          navigate(`/c/${c.id}?fresh=1`);
        }}
      >
        친구에게 도전장
      </button>
    </div>
  );
}
