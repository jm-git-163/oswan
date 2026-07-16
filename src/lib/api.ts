import type { Challenge, SessionRecord, SoftUser } from './types';
import { getSupabase, isSupabaseConfigured } from './supabase';

export type LeaderboardRow = {
  soft_user_id: string;
  nickname: string;
  reps_sum: number;
  clears_count: number;
  sessions_count: number;
  rank: number;
};

export type DayStat = {
  day: string;
  reps_sum: number;
  sessions_count: number;
  clears_count: number;
};

export function backendStatus(): 'off' | 'on' {
  return isSupabaseConfigured ? 'on' : 'off';
}

let lastSyncOk = true;

export function lastBackendSyncOk(): boolean {
  return lastSyncOk;
}

function noteSync(ok: boolean) {
  lastSyncOk = ok;
}

export async function syncSoftUser(user: SoftUser): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from('soft_users').upsert({
    id: user.id,
    nickname: user.nickname,
    last_seen_at: new Date().toISOString(),
    platform: 'web',
    app_version: '1.0.0',
  });
  if (error) {
    noteSync(false);
    return;
  }
  noteSync(true);
}

export async function syncSession(session: SessionRecord): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  const { error } = await sb.from('sessions').upsert({
    id: session.id,
    soft_user_id: session.softUserId,
    started_at: session.startedAt,
    ended_at: session.endedAt,
    reps: session.reps,
    target_reps: session.targetReps,
    cleared: session.cleared,
    duration_ms: session.durationMs,
    rule_version: session.ruleVersion,
    challenge_id: session.challengeId ?? null,
    source: session.challengeId ? 'challenge' : 'free',
  });
  if (error) {
    noteSync(false);
    return;
  }
  noteSync(true);
}

export async function syncChallenge(c: Challenge): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from('challenges').upsert({
    id: c.id,
    from_soft_user_id: c.fromSoftUserId,
    from_nickname: c.fromNickname,
    to_soft_user_id: c.toSoftUserId ?? null,
    to_nickname: c.toNickname ?? null,
    target_reps: c.targetReps,
    deadline_at: c.deadlineAt,
    status: c.status,
    rule_version: c.ruleVersion,
    win_mode: c.winMode,
    from_cleared: c.fromCleared ?? null,
    to_cleared: c.toCleared ?? null,
    from_session_id: c.fromSessionId ?? null,
    to_session_id: c.toSessionId ?? null,
    created_at: c.createdAt,
    // After migration 002: stake_label: c.stakeLabel ?? null,
  });
  if (error) {
    noteSync(false);
    return;
  }
  noteSync(true);
}

export async function fetchLeaderboard(
  period: 'today' | 'week' = 'today',
  limit = 50,
): Promise<LeaderboardRow[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const view = period === 'today' ? 'leaderboard_today' : 'leaderboard_week';
  const { data, error } = await sb.from(view).select('*').order('rank', { ascending: true }).limit(limit);
  if (error) {
    noteSync(false);
    return [];
  }
  noteSync(true);
  return (data ?? []) as LeaderboardRow[];
}

export async function fetchMyWeekStats(softUserId: string): Promise<DayStat[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const from = new Date();
  from.setDate(from.getDate() - 6);
  const fromDay = from.toISOString().slice(0, 10);
  const { data, error } = await sb
    .from('daily_stats')
    .select('day, reps_sum, sessions_count, clears_count')
    .eq('soft_user_id', softUserId)
    .gte('day', fromDay)
    .order('day', { ascending: true });
  if (error) {
    noteSync(false);
    return [];
  }
  noteSync(true);
  return (data ?? []).map((r) => ({
    day: String(r.day),
    reps_sum: Number(r.reps_sum),
    sessions_count: Number(r.sessions_count),
    clears_count: Number(r.clears_count),
  }));
}

export async function fetchRemoteChallenge(id: string): Promise<Challenge | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const mapRow = (data: Record<string, unknown>): Challenge => ({
    id: String(data.id),
    fromSoftUserId: String(data.from_soft_user_id),
    fromNickname: String(data.from_nickname),
    toSoftUserId: data.to_soft_user_id ? String(data.to_soft_user_id) : undefined,
    toNickname: data.to_nickname ? String(data.to_nickname) : undefined,
    targetReps: Number(data.target_reps),
    deadlineAt: String(data.deadline_at),
    status: data.status as Challenge['status'],
    ruleVersion: String(data.rule_version),
    winMode: (data.win_mode as Challenge['winMode']) || 'clear_target',
    fromCleared: data.from_cleared === true ? true : data.from_cleared === false ? false : undefined,
    toCleared: data.to_cleared === true ? true : data.to_cleared === false ? false : undefined,
    fromSessionId: data.from_session_id ? String(data.from_session_id) : undefined,
    toSessionId: data.to_session_id ? String(data.to_session_id) : undefined,
    createdAt: String(data.created_at),
    stakeLabel: data.stake_label ? String(data.stake_label) : undefined,
  });

  // Full UUID — exact match
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    const { data, error } = await sb.from('challenges').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return mapRow(data as Record<string, unknown>);
  }

  // Short invite code → prefix match on uuid text
  const hex = id.replace(/-/g, '').toLowerCase();
  if (hex.length < 8) return null;
  const like =
    hex.length === 8 ? `${hex}%` : `${hex.slice(0, 8)}-${hex.slice(8)}%`;
  const { data, error } = await sb.from('challenges').select('*').like('id', like).limit(2);
  if (error || !data || data.length !== 1) return null;
  return mapRow(data[0] as Record<string, unknown>);
}
