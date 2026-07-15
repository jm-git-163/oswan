import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BrandHeader } from '../components/BrandMark';
import { ModelSquatExample } from '../components/ModelSquatExample';
import { ShareSheet } from '../components/ShareSheet';
import { TodayEstimatesCard } from '../components/TodayEstimatesCard';
import { HeroStat, SurfaceCard } from '../components/ui';
import { useHomeStats } from '../hooks/useHomeStats';
import { createChallengeAndSync } from '../lib/storage';
import { getLastTarget, setLastTarget } from '../lib/sessionTarget';
import { useAppStore } from '../store';
import type { Challenge } from '../lib/types';

export function HomePage() {
  const user = useAppStore((s) => s.user)!;
  const navigate = useNavigate();
  const location = useLocation();
  const rematch = (location.state as { rematchTarget?: number } | null)?.rematchTarget;
  const [target, setTarget] = useState(() =>
    rematch && rematch > 0 ? rematch : getLastTarget(30),
  );
  const [sheetChallenge, setSheetChallenge] = useState<Challenge | null>(null);
  const [sharing, setSharing] = useState(false);
  const { reps, streak, todayEst, active } = useHomeStats(user, location.key);

  useEffect(() => {
    setLastTarget(target);
  }, [target]);

  const sendChallenge = () => {
    setSharing(true);
    void (async () => {
      const c = await createChallengeAndSync({
        fromSoftUserId: user.id,
        fromNickname: user.nickname,
        targetReps: target,
      });
      setSharing(false);
      setSheetChallenge(c);
    })();
  };

  return (
    <div className="page page-enter">
      <BrandHeader size="lg" />

      <div style={{ marginTop: 36, marginBottom: 8 }}>
        <HeroStat
          value={reps}
          unit="개"
          label="오늘 스쿼트"
          hint={
            <div style={{ marginTop: 10, color: 'var(--accent)', fontWeight: 600, fontSize: 14 }}>
              {streak > 0 ? `▸ ${streak}일 연속 오스완` : '▸ 이번 개수를 채우면 오스완'}
            </div>
          }
        />
      </div>

      <TodayEstimatesCard
        kcal={todayEst.kcal}
        lowerBody={todayEst.lowerBody}
        core={todayEst.core}
        reps={reps}
      />

      <p className="meta" style={{ fontSize: 15, margin: '8px 0 18px', lineHeight: 1.5 }}>
        아래에 정한 개수를 채우면 오스완.
      </p>

      <SurfaceCard className="stack-sm" style={{ marginBottom: 14 }}>
        <div className="meta">이번에 할 개수</div>
        <div className="row">
          <button
            type="button"
            className="cta-secondary"
            style={{ width: 48, padding: 10 }}
            onClick={() => setTarget((t) => Math.max(5, t - 5))}
          >
            −
          </button>
          <div
            className="hero-num"
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 40,
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            {target}
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-tertiary)' }}>개</span>
          </div>
          <button
            type="button"
            className="cta-secondary"
            style={{ width: 48, padding: 10 }}
            onClick={() => setTarget((t) => Math.min(200, t + 5))}
          >
            +
          </button>
        </div>
      </SurfaceCard>

      <div style={{ marginBottom: 14 }}>
        <ModelSquatExample variant="compact" />
      </div>

      <button type="button" className="cta-primary" onClick={() => navigate(`/session?target=${target}`)}>
        스쿼트 시작
      </button>

      {active && (
        <SurfaceCard to={`/c/${active.id}`} accent style={{ marginTop: 14 }}>
          <div className="meta">활성 도전</div>
          <div style={{ fontWeight: 600, marginTop: 6 }}>
            {active.targetReps}개 · {active.fromNickname}
            {active.toNickname ? ` vs ${active.toNickname}` : ''}
          </div>
        </SurfaceCard>
      )}

      <div className="stack-sm" style={{ marginTop: 12 }}>
        <button type="button" className="cta-secondary" disabled={sharing} onClick={sendChallenge}>
          {sharing ? '도전장 준비 중…' : '친구에게 도전장'}
        </button>
        <Link to="/ranking" className="mute-link" style={{ textAlign: 'center' }}>
          오늘의 랭킹 보기 →
        </Link>
      </div>

      {sheetChallenge && (
        <ShareSheet
          open
          challenge={sheetChallenge}
          onClose={() => {
            const id = sheetChallenge.id;
            setSheetChallenge(null);
            navigate(`/c/${id}`);
          }}
        />
      )}
    </div>
  );
}
