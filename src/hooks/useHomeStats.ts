import { useMemo } from 'react';
import {
  clearStreak,
  listChallenges,
  listSessions,
  todayReps,
} from '../lib/storage';
import { estimateSessionsTotal } from '../lib/estimates';
import type { SoftUser } from '../lib/types';

/** Thin home data facade so pages stay UI-focused. */
export function useHomeStats(user: SoftUser, refreshKey?: string) {
  return useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const today = listSessions().filter(
      (s) => s.softUserId === user.id && +new Date(s.endedAt) >= +start,
    );
    const active = listChallenges().find(
      (c) =>
        (c.status === 'open' || c.status === 'accepted') &&
        (c.fromSoftUserId === user.id || c.toSoftUserId === user.id),
    );
    return {
      reps: todayReps(user.id),
      streak: clearStreak(user.id),
      todayEst: estimateSessionsTotal(today),
      active,
    };
  }, [user.id, refreshKey]);
}
