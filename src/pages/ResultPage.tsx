import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandMark } from '../components/BrandMark';
import { SessionEstimatesCard } from '../components/SessionEstimates';
import { ShareSheet } from '../components/ShareSheet';
import { estimateSession } from '../lib/estimates';
import { resultShareText, sharePlainText } from '../lib/share';
import { createChallengeAndSync, getChallenge } from '../lib/storage';
import { useAppStore } from '../store';
import type { Challenge } from '../lib/types';

export function ResultPage() {
  const result = useAppStore((s) => s.lastResult);
  const user = useAppStore((s) => s.user)!;
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [sheetChallenge, setSheetChallenge] = useState<Challenge | null>(null);
  const [sharing, setSharing] = useState(false);

  const secs = useMemo(() => {
    if (!result) return 0;
    return Math.round(result.durationMs / 1000);
  }, [result]);

  if (!result) {
    return (
      <div className="page">
        <p className="meta">결과가 없어요.</p>
        <button className="cta-primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
          홈으로
        </button>
      </div>
    );
  }

  const challenge = result.challengeId ? getChallenge(result.challengeId) : null;

  const shareNative = async () => {
    const est = estimateSession(result.reps, result.durationMs);
    const text = resultShareText(
      user.nickname,
      result.reps,
      result.targetReps,
      result.cleared,
      est,
    );
    await sharePlainText('오스완 · 오늘 스쿼트 완료', text);
  };

  const nudgeChallenge = () => {
    if (challenge) {
      setSheetChallenge(challenge);
      return;
    }
    setSharing(true);
    void (async () => {
      const c = await createChallengeAndSync({
        fromSoftUserId: user.id,
        fromNickname: user.nickname,
        targetReps: result.targetReps,
      });
      setSharing(false);
      setSheetChallenge(c);
    })();
  };

  const retryHref = challenge
    ? `/session?target=${result.targetReps}&challenge=${challenge.id}`
    : `/session?target=${result.targetReps}`;

  return (
    <div className="page" style={{ minHeight: '100dvh', paddingBottom: 40 }}>
      <p className="meta" style={{ letterSpacing: '0.1em' }}>
        RESULT
      </p>

      <div
        ref={cardRef}
        className="card"
        style={{
          marginTop: 20,
          padding: 28,
          background: 'linear-gradient(160deg, #1e1e1e, #151515 55%, #12180a)',
          minHeight: 360,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: '1px solid rgba(200,245,74,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BrandMark size={44} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>오스완</div>
            <div className="meta" style={{ marginTop: 2, color: 'var(--accent)', fontWeight: 600 }}>
              오늘 스쿼트 완료
            </div>
            <div className="meta" style={{ marginTop: 4 }}>
              {user.nickname} · {new Date().toLocaleDateString('ko-KR')}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <div className="hero-num" style={{ fontSize: 84 }}>
            {result.reps}
          </div>
          <div className="meta" style={{ marginTop: 8 }}>
            / {result.targetReps} · {secs}s
          </div>
          <div style={{ marginTop: 24 }}>
            {result.cleared ? (
              <span className="stamp">오스완</span>
            ) : (
              <span className="meta" style={{ fontSize: 15 }}>
                미달 — 다시 하면 오스완
              </span>
            )}
          </div>
        </div>

        <SessionEstimatesCard reps={result.reps} durationMs={result.durationMs} />
        <div className="meta" style={{ marginTop: 14 }}>
          목표 개수 채우면 오늘 스쿼트 완료.
        </div>
      </div>

      {challenge && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="meta">도전</div>
          <div style={{ fontWeight: 600, marginTop: 6 }}>
            {challenge.targetReps}개 · {challenge.fromNickname}
            {challenge.toNickname ? ` ↔ ${challenge.toNickname}` : ''}
          </div>
          <p className="meta" style={{ marginTop: 8, fontSize: 12, lineHeight: 1.4 }}>
            {challenge.fromCleared === true ? '✓' : '·'} {challenge.fromNickname}
            {'  '}
            {challenge.toCleared === true ? '✓' : '·'} {challenge.toNickname || '상대'}
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
        {challenge ? (
          <>
            <button className="cta-primary" onClick={() => navigate(`/c/${challenge.id}`)}>
              도전 현황 보기
            </button>
            <button className="cta-secondary" disabled={sharing} onClick={nudgeChallenge}>
              {sharing ? '준비 중…' : '상대에게 도전장 다시 보내기'}
            </button>
          </>
        ) : (
          <button className="cta-primary" disabled={sharing} onClick={nudgeChallenge}>
            {sharing ? '준비 중…' : '같은 개수로 친구에게 도전'}
          </button>
        )}
        <button className="cta-secondary" onClick={() => void shareNative()}>
          결과 문구 공유
        </button>
        <button className="cta-secondary" onClick={() => navigate('/pride')}>
          영상으로 자랑 · 템플릿 저장/공유 (선택)
        </button>
        <button className="cta-secondary" onClick={() => navigate(retryHref)}>
          다시 하기
        </button>
        <button className="cta-secondary" onClick={() => navigate('/')}>
          홈
        </button>
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
