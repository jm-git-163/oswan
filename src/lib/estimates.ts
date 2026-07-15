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

/** 내부 계산용 자극 스케일 (UI에는 개로만 표시) */
export const LOWER_STIM_GOAL = 55;
export const CORE_STIM_GOAL = 40;

/**
 * 하루 ‘괜찮은 하체 자극’ 참고 개수.
 * 체중 비례 아님. 맨몸 스쿼트 기준의 동기부여용 목표
 * (내부 자극 스케일 LOWER_STIM_GOAL≈55를 일상 세트량으로 읽어 약 65개로 맞춤).
 */
export const DAILY_LOWER_REPS = 65;
/** 코어는 스쿼트에서 하체보다 낮게 잡힌 참고 개수 */
export const DAILY_CORE_REPS = 50;

export function formatReps(n: number): string {
  return `${Math.round(n)}개`;
}

/** @deprecated formatReps와 동일 — ‘개분’ 표현 제거 */
export function formatRepShare(n: number): string {
  return formatReps(n);
}

/** 자극 지수 → 하루 기준 대비 개수 */
export function toRepEquiv(score: number, goalScore: number, goalReps: number): number {
  if (goalScore <= 0) return 0;
  return Math.max(0, Math.round((Math.max(0, score) / goalScore) * goalReps));
}

export function lowerRepEquiv(score: number): number {
  return toRepEquiv(score, LOWER_STIM_GOAL, DAILY_LOWER_REPS);
}

export function coreRepEquiv(score: number): number {
  return toRepEquiv(score, CORE_STIM_GOAL, DAILY_CORE_REPS);
}

/** @deprecated */
export function formatPts(n: number): string {
  return formatReps(toRepEquiv(n, LOWER_STIM_GOAL, DAILY_LOWER_REPS));
}

/** 65개가 어떻게 정해졌는지 — 짧은 안내 */
export const STIMULUS_BASIS_HINT =
  `하루 하체 약 ${DAILY_LOWER_REPS}개는 맨몸 스쿼트용 참고 목표예요. 체중에 따라 바뀌지 않고, ‘이 정도면 하루 하체 자극이 괜찮은 편’으로 정한 숫자입니다. 칼로리만 체중을 반영해요.`;

export const STIMULUS_GOAL_HINT = STIMULUS_BASIS_HINT;

export const STIMULUS_VS_REPS_HINT =
  '템포(속도)도 반영해요. 같은 횟수라도 천천히 앉았다 일어나면 자극 개수가 조금 더 높게 나와요.';

export type StimulusVerdict = 'go' | 'push' | 'done' | 'rest';

export type StimulusCoach = {
  headline: string;
  action: string;
  verdict: StimulusVerdict;
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

/** 하체 점수 갭 → 추가 스쿼트 개수 추천 (5개 단위) */
export function recommendExtraReps(lowerGapScore: number): number {
  const rough = Math.ceil(Math.max(0, lowerGapScore) / 1.1);
  return Math.max(10, Math.min(40, Math.ceil(rough / 5) * 5));
}

function remainingLowerReps(lowerBody: number): number {
  return Math.max(0, DAILY_LOWER_REPS - lowerRepEquiv(lowerBody));
}

/** 코치 — UI는 전부 ‘개’. 내부만 자극 지수. */
export function buildStimulusCoach(input: {
  kcal: number;
  lowerBody: number;
  core: number;
  reps: number;
}): StimulusCoach {
  const { lowerBody, core, reps } = input;
  const lowerEq = lowerRepEquiv(lowerBody);

  const meaningLower = `허벅지·엉덩이 자극을 개수로 맞춘 값이에요. 하루 약 ${DAILY_LOWER_REPS}개면 괜찮은 하체 자극으로 봅니다.`;
  const meaningCore = `배·허리 버티기를 개수로 맞춘 값이에요. 하루 약 ${DAILY_CORE_REPS}개면 OK. 스쿼트에선 하체보다 낮게 나와요.`;

  if (reps <= 0) {
    return {
      headline: '아직 오늘의 자극이 없어요',
      action: `스쿼트 ${formatReps(20)}부터 시작해 보세요`,
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

  if (lowerBody >= LOWER_STIM_GOAL && core >= CORE_STIM_GOAL) {
    return {
      headline: `하체 ${formatReps(DAILY_LOWER_REPS)} 자극 도달`,
      action: `더 하고 싶으면 스쿼트 ${formatReps(10)}~${formatReps(15)}만 추가`,
      verdict: 'done',
      meaningLower,
      meaningCore,
    };
  }

  if (lowerBody >= 40 || reps >= 25) {
    const left = remainingLowerReps(lowerBody);
    const extra = left > 0 ? Math.max(10, Math.min(40, Math.ceil(left / 5) * 5)) : 10;
    return {
      headline: '하체 자극이 거의 찼어요',
      action: `${formatReps(DAILY_LOWER_REPS)}까지 · 스쿼트 ${formatReps(extra)}만 더`,
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
      action: `이어서 스쿼트 ${formatReps(need)}만 더 (하면 약 ${formatReps(after)})`,
      verdict: 'go',
      meaningLower,
      meaningCore,
    };
  }

  const left = remainingLowerReps(lowerBody);
  const extra =
    left > 0
      ? Math.max(10, Math.min(40, Math.ceil(left / 5) * 5))
      : recommendExtraReps(Math.max(10, LOWER_STIM_GOAL - lowerBody));
  return {
    headline: '하체 자극이 아직 가벼워요',
    action: `하루 ${formatReps(DAILY_LOWER_REPS)}을 향해 · 지금 ${formatReps(lowerEq)} · ${formatReps(extra)} 추천`,
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
