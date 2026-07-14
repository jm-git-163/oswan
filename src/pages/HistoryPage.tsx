import { useEffect, useMemo, useState } from 'react';
import { backendStatus, fetchMyWeekStats, type DayStat } from '../lib/api';
import { last7Days, listSessions } from '../lib/storage';
import { useAppStore } from '../store';

export function HistoryPage() {
  const user = useAppStore((s) => s.user)!;
  const [remote, setRemote] = useState<DayStat[] | null>(null);
  const backend = backendStatus();

  useEffect(() => {
    if (backend !== 'on') return;
    fetchMyWeekStats(user.id).then(setRemote);
  }, [user.id, backend]);

  const bars = useMemo(() => {
    if (remote && remote.length > 0) {
      const map = new Map(remote.map((r) => [r.day, r.reps_sum]));
      const out: { label: string; reps: number }[] = [];
      const now = new Date();
      for (let i = 6; i >= 0; i -= 1) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        out.push({
          label: `${d.getMonth() + 1}/${d.getDate()}`,
          reps: map.get(key) ?? 0,
        });
      }
      return out;
    }
    return last7Days(user.id);
  }, [user.id, remote]);

  const sessions = useMemo(
    () => listSessions().filter((s) => s.softUserId === user.id).slice(0, 30),
    [user.id],
  );
  const max = Math.max(1, ...bars.map((b) => b.reps));

  return (
    <div className="page">
      <h1 className="page-title">기록</h1>
      <p className="meta" style={{ marginBottom: 24 }}>
        최근 7일
        {backend === 'on' ? ' · Supabase 동기화' : ' · 로컬'}
      </p>

      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          height: 160,
          marginBottom: 24,
        }}
      >
        {bars.map((b) => (
          <div key={b.label} style={{ flex: 1, textAlign: 'center' }}>
            <div
              style={{
                height: `${Math.max(4, (b.reps / max) * 110)}px`,
                background: b.reps > 0 ? 'var(--accent)' : 'var(--surface-3)',
                borderRadius: 8,
                marginBottom: 8,
                transition: 'height 0.3s',
              }}
            />
            <div className="meta" style={{ fontSize: 10 }}>
              {b.label}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2 }}>{b.reps}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {sessions.length === 0 && <div className="card meta">아직 세션이 없어요.</div>}
        {sessions.map((s) => (
          <div key={s.id} className="card" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700 }}>
                {s.reps}
                <span className="meta"> / {s.targetReps}</span>
              </div>
              <div className="meta" style={{ marginTop: 4 }}>
                {new Date(s.endedAt).toLocaleString('ko-KR')}
              </div>
            </div>
            <div style={{ color: s.cleared ? 'var(--accent)' : 'var(--text-tertiary)', fontWeight: 700 }}>
              {s.cleared ? '오스완' : '미달'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
