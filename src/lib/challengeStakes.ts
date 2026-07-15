/** Social stake only — no payments. Motivates the invitee. */
export const CHALLENGE_STAKES = [
  { id: 'none', label: '걸기 없음' },
  { id: 'coffee', label: '이기면 아아 한 잔' },
  { id: 'pride', label: '이기면 자랑 영상 올리기' },
  { id: 'plus10', label: '지면 다음엔 +10개' },
  { id: 'brag', label: '승자 자랑권 24시간' },
] as const;

export type ChallengeStakeId = (typeof CHALLENGE_STAKES)[number]['id'];

export function stakeLabelFromId(id: ChallengeStakeId | string | undefined): string | undefined {
  if (!id || id === 'none') return undefined;
  const hit = CHALLENGE_STAKES.find((s) => s.id === id);
  return hit?.label;
}

export function normalizeStakeLabel(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const t = raw.trim().slice(0, 28);
  return t || undefined;
}
