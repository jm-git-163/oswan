import type { Challenge, SessionRecord, SoftUser } from './types';
import { syncChallenge, syncSession, syncSoftUser } from './api';

const KEYS = {
  user: 'oswan.softUser',
  sessions: 'oswan.sessions',
  challenges: 'oswan.challenges',
} as const;

function uid(): string {
  return crypto.randomUUID();
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function fire(p: Promise<void>) {
  void p.catch((e) => console.warn('[oswan] sync', e));
}

export function getSoftUser(): SoftUser | null {
  return read<SoftUser | null>(KEYS.user, null);
}

export function createSoftUser(nickname: string): SoftUser {
  const user: SoftUser = {
    id: uid(),
    nickname: nickname.trim().slice(0, 12) || '스쿼터',
    createdAt: new Date().toISOString(),
  };
  write(KEYS.user, user);
  fire(syncSoftUser(user));
  return user;
}

export function updateNickname(nickname: string): SoftUser | null {
  const user = getSoftUser();
  if (!user) return null;
  const next = { ...user, nickname: nickname.trim().slice(0, 12) || user.nickname };
  write(KEYS.user, next);
  fire(syncSoftUser(next));
  return next;
}

/** Wipe local Soft ID + sessions/challenges/prefs (Play deletion / reset). */
export function clearLocalAccount(): void {
  try {
    localStorage.removeItem(KEYS.user);
    localStorage.removeItem(KEYS.sessions);
    localStorage.removeItem(KEYS.challenges);
    localStorage.removeItem('oswan.bodyWeightKg');
    localStorage.removeItem('oswan.coachPrefs');
    localStorage.removeItem('oswan.coachPrefs.v2');
  } catch {
    /* ignore */
  }
}

/**
 * Bind a recipient SoftUser before accepting a challenge.
 * Never reuse the sender's Soft ID — sessions must stay separate.
 */
export function ensureChallengeRecipient(
  nickname: string,
  fromSoftUserId: string,
): SoftUser {
  const name = nickname.trim().slice(0, 12) || '스쿼터';
  const current = getSoftUser();
  if (!current || current.id === fromSoftUserId) {
    return createSoftUser(name);
  }
  return updateNickname(name) ?? current;
}

export function listSessions(): SessionRecord[] {
  return read<SessionRecord[]>(KEYS.sessions, []).sort(
    (a, b) => +new Date(b.endedAt) - +new Date(a.endedAt),
  );
}

export function addSession(input: Omit<SessionRecord, 'id'>): SessionRecord {
  const session: SessionRecord = { ...input, id: uid() };
  const all = listSessions();
  write(KEYS.sessions, [session, ...all].slice(0, 200));
  const user = getSoftUser();
  if (user) fire(syncSoftUser(user).then(() => syncSession(session)));
  else fire(syncSession(session));
  return session;
}

export function todayReps(softUserId: string): number {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return listSessions()
    .filter((s) => s.softUserId === softUserId && +new Date(s.endedAt) >= +start)
    .reduce((sum, s) => sum + s.reps, 0);
}

export function clearStreak(softUserId: string): number {
  const sessions = listSessions().filter((s) => s.softUserId === softUserId && s.cleared);
  if (sessions.length === 0) return 0;

  const days = new Set(
    sessions.map((s) => {
      const d = new Date(s.endedAt);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }),
  );

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);

  // allow today not yet cleared — count from yesterday
  const todayKey = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
  if (!days.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  for (;;) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    if (!days.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function last7Days(softUserId: string): { label: string; reps: number }[] {
  const out: { label: string; reps: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const reps = listSessions()
      .filter(
        (s) =>
          s.softUserId === softUserId &&
          +new Date(s.endedAt) >= +d &&
          +new Date(s.endedAt) < +next,
      )
      .reduce((sum, s) => sum + s.reps, 0);
    out.push({
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      reps,
    });
  }
  return out;
}

export function listChallenges(): Challenge[] {
  const all = read<Challenge[]>(KEYS.challenges, []);
  const now = Date.now();
  let dirty = false;
  const next = all.map((c) => {
    if ((c.status === 'open' || c.status === 'accepted') && +new Date(c.deadlineAt) < now) {
      dirty = true;
      return { ...c, status: 'expired' as const };
    }
    return c;
  });
  if (dirty) write(KEYS.challenges, next);
  return next.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function getChallenge(id: string): Challenge | null {
  return listChallenges().find((c) => c.id === id) ?? null;
}

export function createChallenge(input: {
  fromSoftUserId: string;
  fromNickname: string;
  targetReps: number;
  deadlineHours?: number;
  stakeLabel?: string;
}): Challenge {
  const hours = input.deadlineHours ?? 24;
  const stake = input.stakeLabel?.trim().slice(0, 28);
  const challenge: Challenge = {
    id: uid(),
    fromSoftUserId: input.fromSoftUserId,
    fromNickname: input.fromNickname,
    targetReps: input.targetReps,
    deadlineAt: new Date(Date.now() + hours * 3600_000).toISOString(),
    status: 'open',
    ruleVersion: 'hss-v3',
    winMode: 'clear_target',
    ...(stake ? { stakeLabel: stake } : {}),
    createdAt: new Date().toISOString(),
  };
  write(KEYS.challenges, [challenge, ...listChallenges()]);
  const user = getSoftUser();
  if (user) fire(syncSoftUser(user).then(() => syncChallenge(challenge)));
  else fire(syncChallenge(challenge));
  return challenge;
}

export function upsertChallenge(challenge: Challenge, opts?: { sync?: boolean }): void {
  const all = listChallenges();
  const idx = all.findIndex((c) => c.id === challenge.id);
  if (idx >= 0) all[idx] = challenge;
  else all.unshift(challenge);
  write(KEYS.challenges, all);
  if (opts?.sync === false) return;
  fire(syncChallenge(challenge));
}

/** Prefer fresher membership / clear flags from remote without wiping local seed. */
export function mergeChallenge(local: Challenge | null, remote: Challenge | null): Challenge | null {
  if (!local && !remote) return null;
  if (!local) return remote;
  if (!remote) return local;

  const statusRank: Record<Challenge['status'], number> = {
    open: 0,
    accepted: 1,
    completed: 2,
    expired: 3,
  };
  const status =
    statusRank[remote.status] >= statusRank[local.status] ? remote.status : local.status;

  return {
    ...local,
    ...remote,
    status,
    toSoftUserId: remote.toSoftUserId ?? local.toSoftUserId,
    toNickname: remote.toNickname ?? local.toNickname,
    fromCleared: remote.fromCleared ?? local.fromCleared,
    toCleared: remote.toCleared ?? local.toCleared,
    fromSessionId: remote.fromSessionId ?? local.fromSessionId,
    toSessionId: remote.toSessionId ?? local.toSessionId,
    fromNickname: remote.fromNickname || local.fromNickname,
    targetReps: remote.targetReps || local.targetReps,
    deadlineAt: remote.deadlineAt || local.deadlineAt,
    stakeLabel: remote.stakeLabel || local.stakeLabel,
  };
}

export function acceptChallenge(
  id: string,
  softUserId: string,
  nickname: string,
): Challenge | null {
  const c = getChallenge(id);
  if (!c || c.status === 'expired' || c.status === 'completed') return null;
  if (c.fromSoftUserId === softUserId) return c;
  if (c.toSoftUserId && c.toSoftUserId !== softUserId) return null;
  const next: Challenge = {
    ...c,
    toSoftUserId: softUserId,
    toNickname: nickname.trim().slice(0, 12) || nickname,
    status: 'accepted',
  };
  upsertChallenge(next);
  return next;
}

export function completeChallenge(
  id: string,
  softUserId: string,
  cleared: boolean,
  sessionId: string,
): Challenge | null {
  const c = getChallenge(id);
  if (!c) return null;

  let next: Challenge = { ...c };

  if (softUserId === c.fromSoftUserId) {
    next = { ...next, fromCleared: cleared, fromSessionId: sessionId };
  } else if (softUserId === c.toSoftUserId) {
    next = { ...next, toCleared: cleared, toSessionId: sessionId };
  } else if (!c.toSoftUserId && softUserId !== c.fromSoftUserId) {
    // Safety: first challenge session from non-sender binds as recipient
    const nick = getSoftUser()?.nickname ?? '도전러';
    next = {
      ...next,
      toSoftUserId: softUserId,
      toNickname: nick,
      status: next.status === 'open' ? 'accepted' : next.status,
      toCleared: cleared,
      toSessionId: sessionId,
    };
  }

  if (next.toSoftUserId && next.fromCleared !== undefined && next.toCleared !== undefined) {
    next = { ...next, status: 'completed' };
  } else if (next.status === 'open' && softUserId === c.fromSoftUserId) {
    next = { ...next, status: 'open' };
  }

  upsertChallenge(next);
  return next;
}

export function importChallengeFromPayload(payload: Challenge): Challenge {
  const existing = getChallenge(payload.id);
  const merged = mergeChallenge(existing, payload) ?? payload;
  upsertChallenge(merged, { sync: !existing });
  return merged;
}

/** Persist sync before sharing so bare /c/:id works for recipients. */
export async function createChallengeAndSync(input: {
  fromSoftUserId: string;
  fromNickname: string;
  targetReps: number;
  deadlineHours?: number;
  stakeLabel?: string;
}): Promise<Challenge> {
  const c = createChallenge(input);
  try {
    const user = getSoftUser();
    if (user) await syncSoftUser(user);
    await syncChallenge(c);
  } catch (e) {
    console.warn('[oswan] createChallengeAndSync', e);
  }
  return c;
}

/** Clean invite URL — keep query minimal for messengers. */
export function challengeShareUrl(challenge: Challenge): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const url = new URL(`${window.location.origin}${base}/c/${challenge.id}`);
  // Short seeds only — enough to open if sync lags
  url.searchParams.set('n', challenge.fromNickname.slice(0, 12));
  url.searchParams.set('r', String(challenge.targetReps));
  url.searchParams.set('f', challenge.fromSoftUserId);
  return url.toString();
}

/** UI label — never print the full URL with query junk. */
export function challengeShareUrlLabel(challenge: Challenge): string {
  try {
    const host = window.location.host.replace(/^www\./, '');
    return `${host}/c/${challenge.id.slice(0, 8)}`;
  } catch {
    return `oswan…/c/${challenge.id.slice(0, 8)}`;
  }
}

/** Rebuild invite from compact query when recipient has no local/remote copy. */
export function challengeFromCompact(
  id: string,
  params: {
    n: string | null;
    r: string | null;
    f: string | null;
    dl: string | null;
    s?: string | null;
  },
): Challenge | null {
  if (!params.n || !params.r || !params.f) return null;
  const targetReps = Math.max(1, Number(params.r) || 30);
  const deadlineAt =
    params.dl && !Number.isNaN(+new Date(params.dl))
      ? params.dl
      : new Date(Date.now() + 24 * 3600_000).toISOString();
  const stake = params.s?.trim().slice(0, 28);
  return {
    id,
    fromSoftUserId: params.f,
    fromNickname: params.n,
    targetReps,
    deadlineAt,
    status: 'open',
    ruleVersion: 'hss-v3',
    winMode: 'clear_target',
    ...(stake ? { stakeLabel: stake } : {}),
    createdAt: new Date().toISOString(),
  };
}

export function decodeChallengePayload(raw: string | null): Challenge | null {
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(escape(atob(raw)))) as Challenge;
  } catch {
    try {
      return JSON.parse(decodeURIComponent(atob(raw))) as Challenge;
    } catch {
      return null;
    }
  }
}
