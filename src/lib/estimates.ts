/** Session fitness estimates (reference only — not medical). */

export const DEFAULT_BODY_WEIGHT_KG = 65;

/** ACSM-style bodyweight resistance / calisthenics band. */
const SQUAT_MET = 5.0;

const WEIGHT_KEY = 'oswan.bodyWeightKg';

export type SessionEstimates = {
  kcal: number;
  /** 이번 세션 하체(대퇴·둔근) 자극 추정 0–100 */
  lowerBody: number;
  /** 이번 세션 코어(복근·안정화) 자극 추정 0–100 */
  core: number;
  weightKg: number;
  usedDefaultWeight: boolean;
};

export function getBodyWeightKg(): number {
  try {
    const raw = localStorage.getItem(WEIGHT_KEY);
    if (!raw) return DEFAULT_BODY_WEIGHT_KG;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 30 || n > 200) return DEFAULT_BODY_WEIGHT_KG;
    return Math.round(n);
  } catch {
    return DEFAULT_BODY_WEIGHT_KG;
  }
}

export function setBodyWeightKg(kg: number): number {
  const clamped = Math.min(200, Math.max(30, Math.round(kg)));
  localStorage.setItem(WEIGHT_KEY, String(clamped));
  return clamped;
}

export function hasCustomBodyWeight(): boolean {
  try {
    const raw = localStorage.getItem(WEIGHT_KEY);
    if (!raw) return false;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 30 && n <= 200;
  } catch {
    return false;
  }
}

/**
 * Calories: max of MET×time and a modest per-rep floor so brisk sessions still register.
 * Strength indices: volume + density heuristics for squat (legs primary, core isometric).
 */
export function estimateSession(
  reps: number,
  durationMs: number,
  weightKg = getBodyWeightKg(),
): SessionEstimates {
  const r = Math.max(0, reps);
  const ms = Math.max(0, durationMs);
  const hours = Math.max(ms / 3_600_000, 1 / 3600);
  const secs = ms / 1000;

  const fromMet = SQUAT_MET * weightKg * hours;
  const fromReps = (weightKg / 70) * 0.42 * r;
  const kcal = Math.max(1, Math.round(Math.max(fromMet, fromReps * 0.85)));

  const rpm = secs > 0 ? (r / secs) * 60 : 0;
  const density = Math.min(1.25, Math.max(0.7, rpm / 20));

  const lowerRaw = r * 1.15 * density + Math.min(20, secs / 12);
  const coreRaw = r * 0.72 * density + Math.min(28, secs / 9);

  const lowerBody = clampScore(lowerRaw);
  const core = clampScore(coreRaw);

  return {
    kcal,
    lowerBody,
    core,
    weightKg,
    usedDefaultWeight: !hasCustomBodyWeight(),
  };
}

export function estimateSessionsTotal(
  sessions: { reps: number; durationMs: number }[],
  weightKg = getBodyWeightKg(),
): { kcal: number; lowerBody: number; core: number } {
  if (sessions.length === 0) return { kcal: 0, lowerBody: 0, core: 0 };
  let kcal = 0;
  let lower = 0;
  let core = 0;
  for (const s of sessions) {
    const e = estimateSession(s.reps, s.durationMs, weightKg);
    kcal += e.kcal;
    lower += e.lowerBody;
    core += e.core;
  }
  const n = sessions.length;
  return {
    kcal,
    lowerBody: Math.round(lower / n),
    core: Math.round(core / n),
  };
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function stimulusLabel(score: number): string {
  if (score >= 80) return '강함';
  if (score >= 55) return '보통+';
  if (score >= 30) return '보통';
  if (score >= 12) return '가벼움';
  return '짧음';
}

/** 하루/세션 자극 척도 안내 (동기부여용 · 의료 기준 아님) */
export const STIMULUS_GOAL_HINT =
  '하체 55·코어 40은 자극 점수(0~100)예요. 홈의 오늘 목표 개수(스쿼트 N개)와는 다른 기준입니다.';

export type StimulusVerdict = 'go' | 'push' | 'done' | 'rest';

export type StimulusCoach = {
  /** 큰 한 줄 — 홈에만 노출 */
  headline: string;
  /** 행동 제안 한 줄 */
  action: string;
  verdict: StimulusVerdict;
  /** 상세 페이지용 */
  meaningLower: string;
  meaningCore: string;
};

export function kcalFeel(kcal: number): string {
  if (kcal >= 120) return '꽤 많이 움직였어요';
  if (kcal >= 60) return '탄탄한 유산소 보너스';
  if (kcal >= 25) return '짧은 세트치고 괜찮은 소모';
  if (kcal >= 8) return '워밍업·짧은 세트 수준';
  return '아직 거의 안 움직인 느낌';
}

/** Rough lower-body points ≈ 1.1 per rep (moderate tempo). Round to 5. */
export function recommendExtraReps(lowerGap: number): number {
  const rough = Math.ceil(Math.max(0, lowerGap) / 1.1);
  return Math.max(10, Math.min(40, Math.ceil(rough / 5) * 5));
}

/** 자극 점수 → 짧은 코치 카드용 구조화 문구
 *  55·40 = 하체/코어 자극 점수(0~100). 개수(20개 등)와 다른 축이라 ‘목표’를 섞지 않음.
 */
export function buildStimulusCoach(input: {
  kcal: number;
  lowerBody: number;
  core: number;
  reps: number;
}): StimulusCoach {
  const { lowerBody, core, reps } = input;
  const meaningLower =
    '허벅지·엉덩이 자극 점수(0~100)예요. 하루 하체 55 이상이면 괜찮은 자극으로 봅니다.';
  const meaningCore =
    '배·허리 버티기 점수(0~100)예요. 하루 코어 40 이상이면 OK. 스쿼트에선 하체보다 낮게 나와요.';

  if (reps <= 0) {
    return {
      headline: '아직 오늘의 자극이 없어요',
      action: '스쿼트 20개부터 시작해 보세요',
      verdict: 'go',
      meaningLower,
      meaningCore,
    };
  }

  if (lowerBody >= 80 || (lowerBody >= 70 && core >= 55)) {
    return {
      headline: '충분히 잘했어요',
      action: '오늘은 여기까지 · 내일도 비슷한 자극이면 OK',
      verdict: 'rest',
      meaningLower,
      meaningCore,
    };
  }

  if (lowerBody >= 55 && core >= 40) {
    return {
      headline: '하체·코어 자극 점수 도달',
      action: '더 하고 싶으면 스쿼트 10~15개만 추가',
      verdict: 'done',
      meaningLower,
      meaningCore,
    };
  }

  if (lowerBody >= 40 || reps >= 25) {
    const gap = Math.max(5, 55 - lowerBody);
    const extra = recommendExtraReps(gap);
    return {
      headline: '하체 자극이 거의 찼어요',
      action: `하체 55까지 · 스쿼트 ${extra}개만 더`,
      verdict: 'push',
      meaningLower,
      meaningCore,
    };
  }

  if (reps < 20) {
    const need = Math.max(20 - reps, 15);
    const after = reps + need;
    return {
      headline: '워밍업 수준이에요',
      action: `이어서 스쿼트 ${need}개만 더 (하면 약 ${after}개)`,
      verdict: 'go',
      meaningLower,
      meaningCore,
    };
  }

  const extra = recommendExtraReps(Math.max(10, 55 - lowerBody));
  return {
    headline: '하체 자극이 아직 가벼워요',
    action: `하체 55를 향해 · 스쿼트 ${extra}개 추천`,
    verdict: 'go',
    meaningLower,
    meaningCore,
  };
}

/**
 * @deprecated 홈은 buildStimulusCoach 사용. 공유 문구용으로 유지.
 */
export function estimateCoachLine(input: {
  kcal: number;
  lowerBody: number;
  core: number;
  reps: number;
}): string {
  const c = buildStimulusCoach(input);
  return `${c.headline}. ${c.action}`;
}
