import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { addSession, completeChallenge } from '../lib/storage';
import { RULE_VERSION } from '../lib/types';
import { useAppStore } from '../store';

/** Camera-free demo / QA: auto-ticks to target. */
export function PracticePage() {
  const [params] = useSearchParams();
  const target = Math.max(1, Number(params.get('target') || 30));
  const challengeId = params.get('challenge') || undefined;
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user)!;
  const setLastResult = useAppStore((s) => s.setLastResult);
  const [reps, setReps] = useState(0);
  const startedAt = useRef(Date.now());
  const done = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      setReps((r) => r + 1);
    }, 450);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (done.current || reps < target) return;
    done.current = true;
    const durationMs = Date.now() - startedAt.current;
    const session = addSession({
      softUserId: user.id,
      startedAt: new Date(startedAt.current).toISOString(),
      endedAt: new Date().toISOString(),
      reps: target,
      targetReps: target,
      cleared: true,
      durationMs,
      challengeId,
      ruleVersion: RULE_VERSION,
    });
    if (challengeId) completeChallenge(challengeId, user.id, true, session.id);
    setLastResult({
      reps: target,
      targetReps: target,
      cleared: true,
      durationMs,
      challengeId,
      sessionId: session.id,
    });
    navigate('/result', { replace: true });
  }, [reps, target, user.id, challengeId, navigate, setLastResult]);

  return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', width: '100%', maxWidth: 400 }}>
        <p className="meta">연습 모드 · 카메라 없음</p>
        <div className="hero-num" style={{ fontSize: 88, margin: '24px 0' }}>
          {Math.min(reps, target)}
          <span style={{ fontSize: 32, color: 'var(--text-secondary)' }}> / {target}</span>
        </div>
        <button className="cta-secondary" onClick={() => navigate('/')}>
          취소
        </button>
      </div>
    </div>
  );
}
