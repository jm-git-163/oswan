import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { startCamera, stopCamera, usePose } from '../hooks/usePose';
import { stanceOk, useSquatEngine } from '../hooks/useSquatEngine';
import { addSession, completeChallenge } from '../lib/storage';
import { RULE_VERSION } from '../lib/types';
import { useAppStore } from '../store';

type Phase = 'boot' | 'stance' | 'calibrating' | 'go' | 'counting';

export function SessionPage() {
  const [params] = useSearchParams();
  const target = Math.max(1, Number(params.get('target') || 30));
  const challengeId = params.get('challenge') || undefined;
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user)!;
  const setLastResult = useAppStore((s) => s.setLastResult);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAt = useRef(Date.now());
  const finished = useRef(false);

  const [phase, setPhase] = useState<Phase>('boot');
  const [permError, setPermError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [pulse, setPulse] = useState(false);

  const { ready, error: poseError, landmarks } = usePose(videoRef);
  const counting = phase === 'counting' || phase === 'calibrating' || phase === 'go';
  const { update, tick } = useSquatEngine(landmarks, counting);
  const stance = useMemo(() => stanceOk(landmarks), [landmarks]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!videoRef.current) return;
        streamRef.current = await startCamera(videoRef.current, 'user');
        if (alive) setPhase('stance');
      } catch {
        setPermError('카메라 권한이 필요해요. 브라우저에서 허용해 주세요.');
      }
    })();
    return () => {
      alive = false;
      stopCamera(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  // stance → auto start calibration when ok for a moment
  useEffect(() => {
    if (phase !== 'stance' || !stance.ok || !ready) return;
    const t = window.setTimeout(() => setPhase('calibrating'), 600);
    return () => clearTimeout(t);
  }, [phase, stance.ok, ready]);

  useEffect(() => {
    if (phase !== 'calibrating') return;
    if (update?.calibration.state === 'ready') {
      setPhase('go');
    }
  }, [phase, update]);

  useEffect(() => {
    if (phase !== 'go') return;
    let n = 3;
    setCountdown(3);
    const id = window.setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(id);
        setCountdown(null);
        startedAt.current = Date.now();
        setPhase('counting');
      } else setCountdown(n);
    }, 800);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (tick > 0) {
      setPulse(true);
      const t = window.setTimeout(() => setPulse(false), 180);
      return () => clearTimeout(t);
    }
  }, [tick]);

  const reps = update?.count ?? 0;

  useEffect(() => {
    if (phase !== 'counting' || finished.current) return;
    if (reps < target) return;
    finished.current = true;
    const durationMs = Date.now() - startedAt.current;
    const session = addSession({
      softUserId: user.id,
      startedAt: new Date(startedAt.current).toISOString(),
      endedAt: new Date().toISOString(),
      reps,
      targetReps: target,
      cleared: true,
      durationMs,
      challengeId,
      ruleVersion: RULE_VERSION,
    });
    if (challengeId) completeChallenge(challengeId, user.id, true, session.id);
    setLastResult({
      reps,
      targetReps: target,
      cleared: true,
      durationMs,
      challengeId,
      sessionId: session.id,
    });
    stopCamera(streamRef.current);
    navigate('/result', { replace: true });
  }, [reps, target, phase, user.id, challengeId, navigate, setLastResult]);

  const stopEarly = () => {
    if (finished.current) return;
    finished.current = true;
    const durationMs = Date.now() - startedAt.current;
    const cleared = reps >= target;
    const session = addSession({
      softUserId: user.id,
      startedAt: new Date(startedAt.current).toISOString(),
      endedAt: new Date().toISOString(),
      reps,
      targetReps: target,
      cleared,
      durationMs,
      challengeId,
      ruleVersion: RULE_VERSION,
    });
    if (challengeId) completeChallenge(challengeId, user.id, cleared, session.id);
    setLastResult({
      reps,
      targetReps: target,
      cleared,
      durationMs,
      challengeId,
      sessionId: session.id,
    });
    stopCamera(streamRef.current);
    navigate('/result', { replace: true });
  };

  const calib = update?.calibration;
  const statusText =
    permError ||
    poseError ||
    (phase === 'boot' && '카메라 준비 중…') ||
    (phase === 'stance' && stance.hint) ||
    (phase === 'calibrating' &&
      (calib?.state === 'unstable'
        ? '흔들림 — 자세 고정'
        : calib?.state === 'pending'
          ? `캘리브 ${(Math.round((calib.progress || 0) * 100))}%`
          : '준비…')) ||
    (countdown !== null && `${countdown}`) ||
    (phase === 'counting' && (update?.phase === 'down' ? '↓' : '↑'));

  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden', background: '#000' }}>
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)',
        }}
      />

      {/* silhouette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            phase === 'stance' || phase === 'calibrating'
              ? 'radial-gradient(ellipse at center, transparent 28%, rgba(0,0,0,0.55) 70%)'
              : 'linear-gradient(180deg, rgba(0,0,0,0.35), transparent 30%, transparent 70%, rgba(0,0,0,0.55))',
        }}
      />
      {(phase === 'stance' || phase === 'calibrating') && (
        <svg
          viewBox="0 0 200 360"
          style={{
            position: 'absolute',
            left: '50%',
            top: '46%',
            transform: 'translate(-50%, -50%)',
            width: '42%',
            maxWidth: 220,
            opacity: stance.ok ? 0.85 : 0.45,
            transition: 'opacity 0.25s',
          }}
        >
          <path
            d="M100 28c12 0 22 10 22 22s-10 22-22 22-22-10-22-22 10-22 22-22zm0 56c28 0 48 8 58 22 6 8 8 18 8 34v40c0 10-6 16-14 16h-16v90c0 12-8 22-18 22s-18-10-18-22v-90H78v90c0 12-8 22-18 22s-18-10-18-22v-90H26c-8 0-14-6-14-16v-40c0-16 2-26 8-34 10-14 30-22 58-22z"
            fill="none"
            stroke={stance.ok ? 'var(--accent)' : '#fff'}
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>
      )}

      <div style={{ position: 'absolute', top: 20, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => {
            stopCamera(streamRef.current);
            navigate('/');
          }}
          style={{ padding: '8px 14px', borderRadius: 999, background: 'rgba(0,0,0,0.55)', fontWeight: 600 }}
        >
          닫기
        </button>
        <div className="meta" style={{ background: 'rgba(0,0,0,0.55)', padding: '8px 12px', borderRadius: 999 }}>
          목표 {target}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '18%',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        {(phase === 'counting' || phase === 'go') && (
          <div
            className="hero-num"
            style={{
              fontSize: pulse ? 96 : 88,
              transition: 'font-size 0.15s',
              textShadow: '0 4px 24px rgba(0,0,0,0.6)',
            }}
          >
            {reps}
            <span style={{ fontSize: 36, color: 'var(--text-secondary)', fontWeight: 600 }}> / {target}</span>
          </div>
        )}
        {countdown !== null && (
          <div className="hero-num" style={{ fontSize: 120, color: 'var(--accent)' }}>
            {countdown}
          </div>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div
          style={{
            textAlign: 'center',
            fontWeight: 600,
            fontSize: 15,
            color: stance.ok || phase === 'counting' ? 'var(--accent)' : '#fff',
            textShadow: '0 2px 12px rgba(0,0,0,0.8)',
          }}
        >
          {statusText}
        </div>
        {phase === 'counting' && (
          <button className="cta-secondary" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={stopEarly}>
            끝내기
          </button>
        )}
      </div>
    </div>
  );
}
