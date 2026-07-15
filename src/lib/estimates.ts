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
  '하체·코어는 0~100 참고 점수예요. 하루 한 번에 하체 55+, 코어 40+면 괜찮은 자극입니다.';

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

/** 자극 점수 → 짧은 코치 카드용 구조화 문구 */
export function buildStimulusCoach(input: {
  kcal: number;
  lowerBody: number;
  core: number;
  reps: number;
}): StimulusCoach {
  const { lowerBody, core, reps } = input;
  const meaningLower =
    '허벅지·엉덩이가 오늘 얼마나 쓰였는지 추정한 점수예요. 개수·템포가 오르면 같이 올라갑니다.';
  const meaningCore =
    '앉았다 일어설 때 배·허리가 버티는 힘 추정이에요. 스쿼트에서는 하체보다 낮게 나오는 게 정상입니다.';

  if (reps <= 0) {
    return {
      headline: '아직 오늘의 자극이 없어요',
      action: '가볍게 20개부터 시작해 보세요',
      verdict: 'go',
      meaningLower,
      meaningCore,
    };
  }

  if (lowerBody >= 80 || (lowerBody >= 70 && core >= 55)) {
    return {
      headline: '충분히 잘했어요',
      action: '오늘은 여기까지 · 내일도 비슷한 개수면 OK',
      verdict: 'rest',
      meaningLower,
      meaningCore,
    };
  }

  if (lowerBody >= 55 && core >= 40) {
    return {
      headline: '오늘 목표 구간 도달',
      action: '더 하고 싶으면 10~15개만 추가 · 폼 우선',
      verdict: 'done',
      meaningLower,
      meaningCore,
    };
  }

  if (lowerBody >= 40 || reps >= 25) {
    const gap = Math.max(5, 55 - lowerBody);
    const extra = recommendExtraReps(gap);
    return {
      headline: '거의 다 왔어요',
      action: `목표까지 스쿼트 ${extra}개만 더 하면 충분해요`,
      verdict: 'push',
      meaningLower,
      meaningCore,
    };
  }

  if (reps < 20) {
    const need = Math.max(20 - reps, 15);
    return {
      headline: '워밍업 수준이에요',
      action: `이어서 ${need}개만 더 채워 보세요 (총 20~30개 목표)`,
      verdict: 'go',
      meaningLower,
      meaningCore,
    };
  }

  const extra = recommendExtraReps(Math.max(10, 55 - lowerBody));
  return {
    headline: '자극이 아직 가벼운 편',
    action: `한 세트 더 · ${extra}개 추천`,
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
