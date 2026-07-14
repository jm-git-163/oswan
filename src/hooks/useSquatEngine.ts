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
 * 스마트폰 바로 앞(셀피·책상 거치) 준비 자세.
 * HSS 카운터 = 머리·어깨만 있으면 됨. 발목·전신·허리 요구 없음.
 */
export function stanceOk(landmarks: Landmark[]): {
  ok: boolean;
  hint: string;
  level: 'far' | 'ok' | 'close' | 'missing';
} {
  if (landmarks.length < 7) {
    return { ok: false, hint: '카메라 앞에 서 주세요', level: 'missing' };
  }

  const vis = (l: Landmark | undefined) => l?.visibility ?? l?.score ?? 0;
  const nose = landmarks[0];
  const lSh = landmarks[5];
  const rSh = landmarks[6];

  if (!nose || vis(nose) < 0.3) {
    return { ok: false, hint: '얼굴이 보이게 카메라 앞에 서 주세요', level: 'missing' };
  }

  const shOk = vis(lSh) >= 0.25 || vis(rSh) >= 0.25;
  if (!shOk) {
    return { ok: false, hint: '어깨까지 들어오게 서 주세요', level: 'missing' };
  }

  // 얼굴이 너무 아래 = 너무 가깝거나 폰 각도가 위를 봄
  if (nose.y > 0.62) {
    return { ok: false, hint: '폰을 조금 내려 · 얼굴이 화면 위쪽에', level: 'close' };
  }

  // 얼굴이 너무 위/작음
  if (nose.y < 0.08) {
    return { ok: false, hint: '폰을 눈높이에 맞추고 정면을 봐 주세요', level: 'far' };
  }

  const shoulderSpan =
    lSh && rSh && vis(lSh) >= 0.2 && vis(rSh) >= 0.2
      ? Math.abs(lSh.x - rSh.x)
      : 0;

  // 어깨가 거의 화면을 채움 = 너무 가까움
  if (shoulderSpan > 0.72) {
    return { ok: false, hint: '팔 하나 정도만 뒤로 — 머리·어깨가 여유 있게', level: 'close' };
  }

  // 어깨가 너무 작음 = 너무 멂 (선택적으로만 요청)
  if (shoulderSpan > 0 && shoulderSpan < 0.12) {
    return { ok: false, hint: '한 걸음만 앞으로 — 얼굴·어깨가 크게', level: 'far' };
  }

  const shY =
    lSh && rSh
      ? (lSh.y + rSh.y) / 2
      : (lSh?.y ?? rSh?.y ?? nose.y + 0.15);

  if (shY + 0.02 < nose.y) {
    return { ok: false, hint: '폰을 세로로 들고 정면을 봐 주세요', level: 'missing' };
  }

  return { ok: true, hint: '좋아요. 이 자세로 스쿼트 준비…', level: 'ok' };
}

/** Soft click for each counted rep (no asset file). */
export function playRepBeep(count: number) {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
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
    /* ignore */
  }
}
