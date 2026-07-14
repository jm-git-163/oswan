import { useEffect, useState } from 'react';
import {
  backendStatus,
  fetchLeaderboard,
  type LeaderboardRow,
} from '../lib/api';
import { useAppStore } from '../store';

export function RankingPage() {
  const user = useAppStore((s) => s.user)!;
  const [period, setPeriod] = useState<'today' | 'week'>('today');
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(false);
  const backend = backendStatus();

  useEffect(() => {
    if (backend !== 'on') return;
    setLoading(true);
    fetchLeaderboard(period)
      .then(setRows)
      .finally(() => setLoading(false));
  }, [period, backend]);

  const mine = rows.find((r) => r.soft_user_id === user.id);

  return (
    <div className="page">
      <h1 className="page-title">랭킹</h1>
      <p className="meta" style={{ marginBottom: 16 }}>
        {backend === 'on'
          ? 'Supabase 실시간 집계 · 닉네임만 공개'
          : '백엔드 미연결 — .env에 VITE_SUPABASE_* 를 넣으면 활성화돼요'}
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['today', 'week'] as const).map((p) => (
          <button
            key={p}
            className={period === p ? 'cta-primary' : 'cta-secondary'}
            style={{ width: 'auto', padding: '10px 18px' }}
            onClick={() => setPeriod(p)}
          >
            {p === 'today' ? '오늘' : '이번 주'}
          </button>
        ))}
      </div>

      {mine && (
        <div
          className="card"
          style={{ marginBottom: 16, border: '1px solid var(--accent)' }}
        >
          <div className="meta">내 순위</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, alignItems: 'baseline' }}>
            <div className="hero-num" style={{ fontSize: 36 }}>
              #{mine.rank}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700 }}>{mine.reps_sum} reps</div>
              <div className="meta">{mine.clears_count} 오스완</div>
            </div>
          </div>
        </div>
      )}

      {backend === 'off' && (
        <div className="card meta" style={{ lineHeight: 1.6 }}>
          로컬만 사용 중입니다. Supabase SQL을 실행하고 환경변수를 설정하면
          전국(공개) 랭킹과 주간 그래프가 서버에서 집계됩니다.
          <br />
          자세한 절차: 프로젝트의 <code>docs/SUPABASE.md</code> · <code>docs/VERCEL.md</code>
        </div>
      )}

      {backend === 'on' && loading && <div className="meta">불러오는 중…</div>}

      {backend === 'on' && !loading && rows.length === 0 && (
        <div className="card meta">아직 랭킹 데이터가 없어요. 스쿼트 한 번 하면 올라갑니다.</div>
      )}

      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        {rows.map((r) => {
          const isMe = r.soft_user_id === user.id;
          return (
            <div
              key={r.soft_user_id}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: isMe ? 'var(--surface-2)' : 'var(--surface-1)',
              }}
            >
              <div
                className="hero-num"
                style={{
                  width: 40,
                  fontSize: 20,
                  color: r.rank <= 3 ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                {r.rank}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>
                  {r.nickname}
                  {isMe ? ' · 나' : ''}
                </div>
                <div className="meta">{r.clears_count} 클리어 · {r.sessions_count} 세션</div>
              </div>
              <div className="hero-num" style={{ fontSize: 22 }}>
                {r.reps_sum}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
