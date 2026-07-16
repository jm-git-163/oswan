/** Session fitness estimates (reference only — not medical). */

export const DEFAULT_BODY_WEIGHT_KG = 65;

/** ACSM-style bodyweight resistance / calisthenics band. */
const SQUAT_MET = 5.0;

const WEIGHT_KEY = 'oswan.bodyWeightKg';

export type SessionEstimates = {
  kcal: number;
  /** 이번 세션 하체(대퇴·둔근) 자극 추정 0–100 — 질감(가벼움~강함)용 */
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
 * Strength indices: volume + density heuristics (feel labels only — not a second “개” unit).
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

  return {
    kcal,
    lowerBody: clampScore(lowerRaw),
    core: clampScore(coreRaw),
    weightKg,
    usedDefaultWeight: !hasCustomBodyWeight(),
  };
}

/** 하루/기간 합산 — 세션 평균이 아니라 총 개수·총 시간으로 한 번에 추정 */
export function estimateSessionsTotal(
  sessions: { reps: number; durationMs: number }[],
  weightKg = getBodyWeightKg(),
): { kcal: number; lowerBody: number; core: number; reps: number } {
  if (sessions.length === 0) return { kcal: 0, lowerBody: 0, core: 0, reps: 0 };
  const reps = sessions.reduce((s, x) => s + Math.max(0, x.reps), 0);
  const durationMs = sessions.reduce((s, x) => s + Math.max(0, x.durationMs), 0);
  const e = estimateSession(reps, durationMs, weightKg);
  return { kcal: e.kcal, lowerBody: e.lowerBody, core: e.core, reps };
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

/** 내부 질감 스케일 (UI 개수와 분리) */
export const LOWER_STIM_GOAL = 55;
export const CORE_STIM_GOAL = 40;

/**
 * 하루 권장 하체 자극 = 맨몸 스쿼트 개수 목표.
 * 진행도도 실제 스쿼트 개수로만 표시 (환산 개수 없음).
 */
export const DAILY_LOWER_REPS = 65;
/** 코어 참고 목표(스쿼트 개수 환산 — 하체보다 느리게 참) */
export const DAILY_CORE_REPS = 50;

export function formatReps(n: number): string {
  return `${Math.round(n)}개`;
}

/** @deprecated */
export function formatRepShare(n: number): string {
  return formatReps(n);
}

/** 하체 권장 진행: 실제 스쿼트 개수 ↔ 목표 65개 (동일 단위) */
export function lowerGoalProgress(reps: number): {
  current: number;
  goal: number;
  left: number;
  pct: number;
} {
  const current = Math.max(0, Math.round(reps));
  const goal = DAILY_LOWER_REPS;
  const left = Math.max(0, goal - current);
  const pct = Math.min(100, Math.round((current / goal) * 100));
  return { current, goal, left, pct };
}

/**
 * 코어는 스쿼트 1개가 하체만큼 안 채워지므로 비율로 환산.
 * 표시 단위는 여전히 ‘스쿼트 개수’ (목표 DAILY_CORE_REPS개 상당).
 */
export function coreGoalProgress(reps: number): {
  current: number;
  goal: number;
  left: number;
  pct: number;
} {
  const goal = DAILY_CORE_REPS;
  const current = Math.min(goal * 2, Math.round(Math.max(0, reps) * (DAILY_CORE_REPS / DAILY_LOWER_REPS)));
  const left = Math.max(0, goal - current);
  const pct = Math.min(100, Math.round((current / goal) * 100));
  return { current, goal, left, pct };
}

/** @deprecated 환산 개수 제거 — 실제 개수(lowerGoalProgress) 사용 */
export function toRepEquiv(score: number, goalScore: number, goalReps: number): number {
  if (goalScore <= 0) return 0;
  return Math.max(0, Math.round((Math.max(0, score) / goalScore) * goalReps));
}

/** @deprecated use lowerGoalProgress(reps).current */
export function lowerRepEquiv(score: number): number {
  return toRepEquiv(score, LOWER_STIM_GOAL, DAILY_LOWER_REPS);
}

/** @deprecated use coreGoalProgress(reps).current */
export function coreRepEquiv(score: number): number {
  return toRepEquiv(score, CORE_STIM_GOAL, DAILY_CORE_REPS);
}

/** @deprecated */
export function formatPts(n: number): string {
  return formatReps(lowerRepEquiv(n));
}

export const STIMULUS_BASIS_HINT =
  `권장 하체 자극 = 하루 스쿼트 약 ${DAILY_LOWER_REPS}개예요. 진행 숫자도 같은 ‘스쿼트 개수’입니다. 체중은 칼로리에만 반영돼요.`;

export const STIMULUS_GOAL_HINT = STIMULUS_BASIS_HINT;

export const STIMULUS_VS_REPS_HINT =
  '‘강함·보통·가벼움’은 템포·밀도 질감이에요. 목표까지 남은 개수는 오늘 한 스쿼트 개수로만 셉니다.';

export type StimulusVerdict = 'go' | 'push' | 'done' | 'rest';

export type StimulusCoach = {
  headline: string;
  action: string;
  verdict: StimulusVerdict;
  meaningLower: string;
  meaningCore: string;
  /** 권장 하체까지 남은 실제 스쿼트 개수 */
  leftSquats: number;
};

export function kcalFeel(kcal: number): string {
  if (kcal >= 120) return '꽤 많이 움직였어요';
  if (kcal >= 60) return '탄탄한 유산소 보너스';
  if (kcal >= 25) return '짧은 세트치고 괜찮은 소모';
  if (kcal >= 8) return '워밍업·짧은 세트 수준';
  return '아직 거의 안 움직인 느낌';
}

/** @deprecated */
export function recommendExtraReps(lowerGapScore: number): number {
  const rough = Math.ceil(Math.max(0, lowerGapScore) / 1.1);
  return Math.max(10, Math.min(40, Math.ceil(rough / 5) * 5));
}

/** 코치 — 개수는 전부 실제 스쿼트 */
export function buildStimulusCoach(input: {
  kcal: number;
  lowerBody: number;
  core: number;
  reps: number;
}): StimulusCoach {
  const { lowerBody, reps } = input;
  const { current, goal, left } = lowerGoalProgress(reps);
  const feel = stimulusLabel(lowerBody);

  const meaningLower = `오늘 스쿼트 ${formatReps(current)} / 권장 하체 자극 ${formatReps(goal)}. 같은 단위(스쿼트 개수)예요.`;
  const meaningCore = `코어는 스쿼트로 천천히 채워져요. 참고 목표 약 ${formatReps(DAILY_CORE_REPS)} 상당.`;

  if (reps <= 0) {
    return {
      headline: '아직 오늘의 자극이 없어요',
      action: `스쿼트 ${formatReps(20)}부터 시작해 보세요`,
      verdict: 'go',
      meaningLower,
      meaningCore,
      leftSquats: goal,
    };
  }

  if (lowerBody >= 80 && current >= goal) {
    return {
      headline: '충분히 잘했어요',
      action: '오늘은 여기까지 · 내일도 비슷한 자극이면 OK',
      verdict: 'rest',
      meaningLower,
      meaningCore,
      leftSquats: 0,
    };
  }

  if (current >= goal) {
    return {
      headline: `권장 하체 자극 도달 (${formatReps(goal)})`,
      action:
        lowerBody >= LOWER_STIM_GOAL
          ? `더 하고 싶으면 스쿼트 ${formatReps(10)}~${formatReps(15)}만 추가`
          : `목표는 채웠어요 · 질감은 ${feel} — 천천히 앉았다 일어나면 자극이 더 남아요`,
      verdict: 'done',
      meaningLower,
      meaningCore,
      leftSquats: 0,
    };
  }

  const extra = Math.max(5, Math.min(40, Math.ceil(left / 5) * 5));

  if (current >= goal * 0.6 || reps >= 25) {
    return {
      headline: '권장 하체 자극이 가까워요',
      action: `권장 하체 자극까지 스쿼트 ${formatReps(extra)}만 더`,
      verdict: 'push',
      meaningLower,
      meaningCore,
      leftSquats: left,
    };
  }

  if (reps < 20) {
    return {
      headline: '워밍업 수준이에요',
      action: `권장 하체 자극(${formatReps(goal)})까지 스쿼트 ${formatReps(extra)}만 더`,
      verdict: 'go',
      meaningLower,
      meaningCore,
      leftSquats: left,
    };
  }

  return {
    headline: '하체 자극을 더 채워 봐요',
    action: `권장 하체 자극까지 스쿼트 ${formatReps(extra)}만 더 (지금 ${formatReps(current)}/${formatReps(goal)})`,
    verdict: 'go',
    meaningLower,
    meaningCore,
    leftSquats: left,
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
