import { useEffect, useRef, useState } from 'react';
import {
  HeadShoulderSquatDetector,
  type HssUpdate,
} from '../engine/headShoulderSquat';
import type { Landmark } from './usePose';

export function useSquatEngine(landmarks: Landmark[], active: boolean) {
  const detector = useRef(new HeadShoulderSquatDetector());
  const [update, setUpdate] = useState<HssUpdate | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active) return;
    detector.current.reset();
    setUpdate(null);
  }, [active]);

  useEffect(() => {
    if (!active || landmarks.length < 7) return;
    const next = detector.current.update(landmarks, performance.now());
    setUpdate(next);
    if (next.justCounted) setTick((t) => t + 1);
  }, [landmarks, active]);

  const reset = () => {
    detector.current.reset();
    setUpdate(null);
    setTick(0);
  };

  return { update, tick, reset };
}

/**
 * 폰을 1.5~2m 앞에 세워두고 정면으로 서는 현실 세팅용 게이트.
 * HSS 카운터는 머리·어깨면 동작하지만, 깊이 신뢰도를 위해 엉덩이까지 권장.
 * (발목 전신은 soft — 강제는 집에서 사실상 불가능한 경우 많음)
 */
export function stanceOk(landmarks: Landmark[]): {
  ok: boolean;
  hint: string;
  level: 'far' | 'ok' | 'close' | 'missing';
} {
  if (landmarks.length < 17) {
    return { ok: false, hint: '카메라 앞에 서 주세요', level: 'missing' };
  }

  const vis = (l: Landmark | undefined) => l?.visibility ?? l?.score ?? 0;
  const nose = landmarks[0];
  const lSh = landmarks[5];
  const rSh = landmarks[6];
  const lHip = landmarks[11];
  const rHip = landmarks[12];

  if (vis(nose) < 0.35 || (vis(lSh) < 0.3 && vis(rSh) < 0.3)) {
    return { ok: false, hint: '얼굴·어깨가 들어오게 서 주세요', level: 'missing' };
  }

  const shY = ((lSh?.y ?? 0) + (rSh?.y ?? 0)) / 2;
  const hipVis = Math.max(vis(lHip), vis(rHip));
  const hipY =
    hipVis >= 0.25
      ? ((vis(lHip) >= 0.25 ? lHip!.y : 0) + (vis(rHip) >= 0.25 ? rHip!.y : 0)) /
        (Number(vis(lHip) >= 0.25) + Number(vis(rHip) >= 0.25) || 1)
      : null;

  // 너무 가까움: 코가 화면 너무 아래(=확대) 또는 어깨 폭이 거의 전체
  if (nose.y > 0.55) {
    return { ok: false, hint: '한두 걸음 뒤로 — 상체가 덜 크게', level: 'close' };
  }

  if (hipY === null || hipVis < 0.25) {
    return {
      ok: false,
      hint: '조금 더 뒤로 — 허리(엉덩이)까지 보이게',
      level: 'close',
    };
  }

  // 머리~엉덩이 높이가 너무 작으면 아직 멂/잘림
  const torso = Math.abs(hipY - (nose?.y ?? 0));
  if (torso < 0.22) {
    return { ok: false, hint: '한 걸음 앞으로 — 상체가 더 크게', level: 'far' };
  }

  // 어깨가 너무 아래로 깔리면 각도 이상
  if (shY < nose.y) {
    return { ok: false, hint: '폰을 세로로, 높이 허리~가슴 근처', level: 'missing' };
  }

  return { ok: true, hint: '좋아요. 가만히 서서 준비…', level: 'ok' };
}

/** Soft click for each counted rep (no asset file). */
export function playRepBeep(count: number) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    // slight pitch up every 10 reps
    o.frequency.value = count > 0 && count % 10 === 0 ? 880 : 660;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(ctx.destination);
    const t = ctx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.start(t);
    o.stop(t + 0.13);
    o.onended = () => void ctx.close();
  } catch {
    /* ignore autoplay / unsupported */
  }
}
