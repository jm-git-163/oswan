import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheerBurst } from '../components/CheerBurst';
import { CoachToggles } from '../components/CoachToggles';
import { ModelSquatExample } from '../components/ModelSquatExample';
import { SquatSetupGuide } from '../components/SquatSetupGuide';
import { startCamera, stopCamera, releaseVideo, usePose } from '../hooks/usePose';
import { HEAD_GUIDE, playRepBeep, stanceOk, useSquatEngine } from '../hooks/useSquatEngine';
import { getCoachPrefs, type CoachPrefs } from '../lib/coachPrefs';
import {
  cheerForRep,
  speakCheer,
  startSessionBgm,
  stopSessionBgm,
  type CheerCue,
} from '../lib/sessionCoach';
import { addSession, completeChallenge, getChallenge } from '../lib/storage';
import { RULE_VERSION } from '../lib/types';
import { useAppStore } from '../store';
import { SessionRecorder } from '../video/sessionRecorder';

type Phase = 'need_perm' | 'requesting' | 'stance' | 'calibrating' | 'go' | 'counting';

function cameraErrorMessage(err: unknown): string {
  const name = err && typeof err === 'object' && 'name' in err ? String((err as DOMException).name) : '';
  if (!window.isSecureContext && location.hostname !== 'localhost') {
    return 'HTTPS에서만 카메라를 쓸 수 있어요. oswan.vercel.app 로 열어 주세요.';
  }
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return '카메라가 차단됐어요. 주소창 자물쇠/ⓘ → 카메라 → 허용 후 다시 눌러 주세요.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return '카메라를 찾지 못했어요. 다른 기기나 브라우저로 시도해 주세요.';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return '카메라를 잠글 수 없어요. 다른 탭·앱(줌, 카메라앱, oswan 다른 탭)을 모두 닫고, 이 페이지를 새로고침한 뒤 다시 「허용하기」를 눌러 주세요.';
  }
  return '카메라를 켜지 못했어요. 허용 버튼을 다시 눌러 주세요.';
}

export function SessionPage() {
  const [params] = useSearchParams();
  const target = Math.max(1, Number(params.get('target') || 30));
  const challengeId = params.get('challenge') || undefined;
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user)!;
  const setLastResult = useAppStore((s) => s.setLastResult);
  const setLastRawVideo = useAppStore((s) => s.setLastRawVideo);

  // Challenge sessions must go through accept on /c/:id first
  useEffect(() => {
    if (!challengeId) return;
    const c = getChallenge(challengeId);
    if (!c) {
      navigate(`/c/${challengeId}`, { replace: true });
      return;
    }
    const allowed =
      c.fromSoftUserId === user.id || c.toSoftUserId === user.id;
    if (!allowed) {
      navigate(`/c/${challengeId}`, { replace: true });
    }
  }, [challengeId, user.id, navigate]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef(new SessionRecorder());
  const startedAt = useRef(Date.now());
  const finished = useRef(false);
  const recording = useRef(false);

  const [phase, setPhase] = useState<Phase>('need_perm');
  const [permError, setPermError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [pulse, setPulse] = useState(false);
  const [coachPrefs, setCoachPrefsState] = useState<CoachPrefs>(() => getCoachPrefs());
  const [cheerCue, setCheerCue] = useState<CheerCue | null>(null);
  const [cheerKey, setCheerKey] = useState(0);
  const [showStanceGuide, setShowStanceGuide] = useState(true);
  const coachPrefsRef = useRef(coachPrefs);
  coachPrefsRef.current = coachPrefs;

  const cameraOn = phase !== 'need_perm' && phase !== 'requesting';
  const { ready, error: poseError, landmarks } = usePose(videoRef, cameraOn);
  const counting = phase === 'counting' || phase === 'calibrating' || phase === 'go';
  const { update, tick } = useSquatEngine(landmarks, counting);
  const stance = useMemo(() => stanceOk(landmarks), [landmarks]);

  useEffect(() => {
    return () => {
      stopSessionBgm();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      void recorderRef.current.stop();
      stopCamera(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (phase === 'counting' && coachPrefs.music) startSessionBgm();
    else stopSessionBgm();
  }, [phase, coachPrefs.music]);

  // Start raw clip recording when countdown hits counting (for pride compose)
  useEffect(() => {
    if (phase !== 'counting' || recording.current) return;
    const video = videoRef.current;
    if (!video) return;
    recording.current = recorderRef.current.start(video);
  }, [phase]);

  const finishSession = useCallback(
    async (repsFinal: number) => {
      if (finished.current) return;
      finished.current = true;
      const durationMs = Date.now() - startedAt.current;
      const cleared = repsFinal >= target;

      const raw = await recorderRef.current.stop();
      recording.current = false;
      setLastRawVideo(raw);

      const session = addSession({
        softUserId: user.id,
        startedAt: new Date(startedAt.current).toISOString(),
        endedAt: new Date().toISOString(),
        reps: repsFinal,
        targetReps: target,
        cleared,
        durationMs,
        challengeId,
        ruleVersion: RULE_VERSION,
      });
      if (challengeId) completeChallenge(challengeId, user.id, cleared, session.id);
      setLastResult({
        reps: repsFinal,
        targetReps: target,
        cleared,
        durationMs,
        challengeId,
        sessionId: session.id,
      });
      stopSessionBgm();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      stopCamera(streamRef.current);
      streamRef.current = null;
      navigate('/result', { replace: true });
    },
    [target, user.id, challengeId, navigate, setLastResult, setLastRawVideo],
  );

  const requestCamera = useCallback(async () => {
    setPermError(null);
    setPhase('requesting');
    try {
      const video = videoRef.current;
      if (!video) {
        setPermError('화면을 준비하지 못했어요. 새로고침 후 다시 시도해 주세요.');
        setPhase('need_perm');
        return;
      }
      stopCamera(streamRef.current);
      streamRef.current = null;
      releaseVideo(video);
      const stream = await startCamera(video, 'user');
      streamRef.current = stream;
      setPhase('stance');
    } catch (err) {
      console.warn('[oswan] camera', err);
      setPermError(cameraErrorMessage(err));
      setPhase('need_perm');
    }
  }, []);

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
      const count = update?.count ?? tick;
      playRepBeep(count);
      if (coachPrefsRef.current.cheer) {
        const cue = cheerForRep(count, target);
        setCheerCue(cue);
        setCheerKey((k) => k + 1);
        if (count % 5 === 0 || count >= target - 3 || cue.tone === 'finish' || cue.tone === 'hot') {
          speakCheer(cue.line);
        }
      }
      const t = window.setTimeout(() => setPulse(false), 180);
      const c = window.setTimeout(() => setCheerCue(null), 1700);
      return () => {
        clearTimeout(t);
        clearTimeout(c);
      };
    }
  }, [tick, update?.count, target]);

  const reps = update?.count ?? 0;

  useEffect(() => {
    if (phase !== 'counting' || finished.current) return;
    if (reps < target) return;
    void finishSession(reps);
  }, [reps, target, phase, finishSession]);

  const stopEarly = () => {
    void finishSession(reps);
  };

  const calib = update?.calibration;
  const statusText =
    (phase === 'stance' && (!ready ? '포즈 엔진 준비 중…' : stance.hint)) ||
    (phase === 'calibrating' &&
      (calib?.state === 'unstable'
        ? '흔들림 — 자세 고정'
        : calib?.state === 'pending'
          ? `캘리브 ${Math.round((calib.progress || 0) * 100)}%`
          : '준비…')) ||
    (countdown !== null && `${countdown}`) ||
    (phase === 'counting' && (update?.phase === 'down' ? '↓' : '↑')) ||
    poseError ||
    '';

  const showPermGate = phase === 'need_perm' || phase === 'requesting';

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
          opacity: cameraOn ? 1 : 0.25,
        }}
      />

      {showPermGate && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 30,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '20px 24px 28px',
            paddingTop: 'max(20px, env(safe-area-inset-top))',
            background: 'rgba(10,10,10,0.96)',
            overflowY: 'auto',
          }}
        >
          <p className="meta" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Camera
          </p>
          <h1 className="page-title" style={{ marginTop: 8 }}>
            카메라가 필요해요
          </h1>
          <p className="meta" style={{ fontSize: 15, lineHeight: 1.55, margin: '12px 0 16px' }}>
            아래 그림처럼 준비한 뒤 허용을 눌러 주세요.
            <br />
            영상은 서버로 전송되지 않아요.
          </p>

          <SquatSetupGuide variant="gate" />

          <ModelSquatExample variant="gate" />

          {permError && (
            <div
              className="card"
              style={{
                marginBottom: 16,
                color: 'var(--warn)',
                fontSize: 14,
                lineHeight: 1.5,
                border: '1px solid var(--warn)',
              }}
            >
              {permError}
            </div>
          )}
          <button
            className="cta-primary"
            disabled={phase === 'requesting'}
            onClick={() => void requestCamera()}
          >
            {phase === 'requesting' ? '요청 중…' : '카메라 허용하기'}
          </button>
          <button
            className="cta-secondary"
            style={{ marginTop: 10 }}
            onClick={() => navigate('/')}
          >
            홈으로
          </button>
        </div>
      )}

      {!showPermGate && (
        <>
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
            <>
              {/* 머리 가이드만 — HSS 카운트 기준점 */}
              <div
                style={{
                  position: 'absolute',
                  left: `${HEAD_GUIDE.cx * 100}%`,
                  top: `${HEAD_GUIDE.cy * 100}%`,
                  width: `${HEAD_GUIDE.rx * 2 * 100}%`,
                  height: `${HEAD_GUIDE.ry * 2 * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  border: `3px ${stance.ok ? 'solid' : 'dashed'} ${stance.ok ? 'var(--accent)' : '#fff'}`,
                  boxShadow: stance.ok
                    ? '0 0 0 9999px rgba(0,0,0,0.35), 0 0 24px rgba(200,245,74,0.45)'
                    : '0 0 0 9999px rgba(0,0,0,0.4)',
                  opacity: 0.95,
                  pointerEvents: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              />
              {stance.head && (
                <div
                  style={{
                    position: 'absolute',
                    // preview is CSS-mirrored; flip landmark x to match
                    left: `${(1 - stance.head.x) * 100}%`,
                    top: `${stance.head.y * 100}%`,
                    width: 14,
                    height: 14,
                    marginLeft: -7,
                    marginTop: -7,
                    borderRadius: '50%',
                    background: stance.ok ? 'var(--accent)' : '#fff',
                    boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                    pointerEvents: 'none',
                  }}
                />
              )}
              <div
                style={{
                  position: 'absolute',
                  left: 16,
                  right: 16,
                  top: 72,
                  textAlign: 'center',
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    background: 'rgba(0,0,0,0.72)',
                    borderRadius: 14,
                    padding: '10px 14px',
                    fontSize: 14,
                    lineHeight: 1.45,
                    fontWeight: 600,
                    color: '#fff',
                  }}
                >
                  <span style={{ color: 'var(--accent)', fontWeight: 800 }}>머리를 원 안에</span>
                  <br />
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: 12 }}>
                    점이 원에 들어오면 그 기준으로 스쿼트를 세어요
                  </span>
                </div>
              </div>
              {showStanceGuide && (
                <div
                  style={{
                    position: 'absolute',
                    left: 12,
                    right: 12,
                    bottom: 100,
                    zIndex: 8,
                    pointerEvents: 'auto',
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <SquatSetupGuide variant="stance" />
                    <button
                      type="button"
                      onClick={() => setShowStanceGuide(false)}
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 8,
                        zIndex: 2,
                        padding: '4px 10px',
                        borderRadius: 999,
                        background: 'rgba(0,0,0,0.7)',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      닫기
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <div
            style={{
              position: 'absolute',
              top: 20,
              left: 16,
              right: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <button
              onClick={() => {
                stopCamera(streamRef.current);
                navigate('/');
              }}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                background: 'rgba(0,0,0,0.55)',
                fontWeight: 600,
              }}
            >
              닫기
            </button>
            <div
              className="meta"
              style={{ background: 'rgba(0,0,0,0.55)', padding: '8px 12px', borderRadius: 999 }}
            >
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
                <span style={{ fontSize: 36, color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {' '}
                  / {target}
                </span>
              </div>
            )}
            {countdown !== null && (
              <div className="hero-num" style={{ fontSize: 120, color: 'var(--accent)' }}>
                {countdown}
              </div>
            )}
          </div>

          {phase === 'counting' && <CheerBurst cue={cheerCue} flashKey={cheerKey} />}

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
            {(phase === 'stance' || phase === 'calibrating' || phase === 'counting') && (
              <CoachToggles
                variant="chips"
                prefs={coachPrefs}
                onChange={setCoachPrefsState}
              />
            )}
            {phase === 'counting' && (
              <button
                className="cta-secondary"
                style={{ background: 'rgba(0,0,0,0.55)' }}
                onClick={stopEarly}
              >
                끝내기
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
