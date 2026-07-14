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
 * 화면 위쪽 「머리 가이드」원 — SessionPage SVG와 동일한 정규화 좌표.
 * HSS 카운트는 코(머리) y와 어깨 차이로 동작하므로, 이 위치에 머리를 두면
 * 캘리브·카운트가 안정적임.
 */
export const HEAD_GUIDE = {
  /** 화면 가로 중앙 */
  cx: 0.5,
  /** 위에서 ~28% — 셀피에서 자연스러운 얼굴 위치 */
  cy: 0.28,
  /** 수용 반경 (정규화, x·y 대략 타원) */
  rx: 0.16,
  ry: 0.12,
};

/**
 * 머리만 가이드 원에 맞추면 OK. 전신·발목·어깨 폭 요구 없음.
 * (어깨는 HSS용으로 보이기만 하면 soft — 판정 강제는 머리)
 */
export function stanceOk(landmarks: Landmark[]): {
  ok: boolean;
  hint: string;
  level: 'far' | 'ok' | 'close' | 'missing';
  /** nose in frame for drawing live marker */
  head?: { x: number; y: number };
} {
  if (landmarks.length < 1) {
    return { ok: false, hint: '카메라 앞에 서 주세요', level: 'missing' };
  }

  const vis = (l: Landmark | undefined) => l?.visibility ?? l?.score ?? 0;
  const nose = landmarks[0];

  if (!nose || vis(nose) < 0.28) {
    return { ok: false, hint: '얼굴이 보이게 서 주세요', level: 'missing' };
  }

  // Landmark x is mirrored relative to mirrored preview — SVG overlay is also
  // drawn on mirrored video, so use nose.x as-is against guide center.
  const dx = (nose.x - HEAD_GUIDE.cx) / HEAD_GUIDE.rx;
  const dy = (nose.y - HEAD_GUIDE.cy) / HEAD_GUIDE.ry;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const head = { x: nose.x, y: nose.y };

  if (dist <= 1) {
    return { ok: true, hint: '좋아요. 머리 고정 · 스쿼트 준비', level: 'ok', head };
  }

  if (nose.y < HEAD_GUIDE.cy - HEAD_GUIDE.ry) {
    return { ok: false, hint: '머리를 조금 아래로 · 원 안에', level: 'far', head };
  }
  if (nose.y > HEAD_GUIDE.cy + HEAD_GUIDE.ry) {
    return { ok: false, hint: '머리를 조금 위로 · 원 안에', level: 'close', head };
  }
  if (Math.abs(nose.x - HEAD_GUIDE.cx) > HEAD_GUIDE.rx) {
    return { ok: false, hint: '머리를 가운데 원에 맞추세요', level: 'missing', head };
  }
  return { ok: false, hint: '머리를 원 안에 맞추세요', level: 'missing', head };
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
