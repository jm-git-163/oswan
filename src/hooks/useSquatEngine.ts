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

/** Simple full-body stance gate for UI (MoveNet indices). */
export function stanceOk(landmarks: Landmark[]): {
  ok: boolean;
  hint: string;
} {
  if (landmarks.length < 17) return { ok: false, hint: '전신이 보이게 서 주세요' };
  const nose = landmarks[0];
  const lAnkle = landmarks[15];
  const rAnkle = landmarks[16];
  const lSh = landmarks[5];
  const rSh = landmarks[6];

  const vis = (l: Landmark | undefined) => l?.visibility ?? l?.score ?? 0;
  if (vis(nose) < 0.3 || vis(lSh) < 0.3 || vis(rSh) < 0.3) {
    return { ok: false, hint: '얼굴과 어깨가 보이게 서 주세요' };
  }
  if (vis(lAnkle) < 0.2 && vis(rAnkle) < 0.2) {
    return { ok: false, hint: '한 발 뒤로 — 발목이 보이게' };
  }
  const bodyH = Math.abs(((lAnkle?.y ?? 1) + (rAnkle?.y ?? 1)) / 2 - (nose?.y ?? 0));
  if (bodyH < 0.35) {
    return { ok: false, hint: '조금 더 멀리 — 전신이 들어오게' };
  }
  return { ok: true, hint: '좋아요. 잠시 가만히…' };
}
