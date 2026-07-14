import { useState } from 'react';
import { Link } from 'react-router-dom';
import { backendStatus } from '../lib/api';
import { updateNickname } from '../lib/storage';
import { useAppStore } from '../store';

export function MePage() {
  const user = useAppStore((s) => s.user)!;
  const setUser = useAppStore((s) => s.setUser);
  const [name, setName] = useState(user.nickname);
  const [saved, setSaved] = useState(false);
  const backend = backendStatus();

  return (
    <div className="page">
      <h1 className="page-title">나</h1>
      <p className="meta" style={{ marginBottom: 24 }}>
        Soft ID · 가입 없이 시작.
        <br />
        백엔드: {backend === 'on' ? 'Supabase 연결됨' : '로컬만 (미연결)'}
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="meta">닉네임</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={12}
          style={{
            width: '100%',
            marginTop: 10,
            padding: '12px 14px',
            borderRadius: 12,
            border: '1px solid var(--surface-3)',
            background: 'var(--surface-2)',
            fontSize: 16,
            outline: 'none',
          }}
        />
        <button
          className="cta-primary"
          style={{ marginTop: 12 }}
          onClick={() => {
            const next = updateNickname(name);
            if (next) {
              setUser(next);
              setSaved(true);
              setTimeout(() => setSaved(false), 1200);
            }
          }}
        >
          {saved ? '저장됨' : '저장'}
        </button>
      </div>

      <div className="card">
        <div className="meta">Soft ID</div>
        <div
          style={{
            fontSize: 12,
            wordBreak: 'break-all',
            marginTop: 8,
            color: 'var(--text-secondary)',
          }}
        >
          {user.id}
        </div>
      </div>

      <Link to="/challenges" className="card" style={{ display: 'block', marginTop: 12 }}>
        <div style={{ fontWeight: 700 }}>도전 목록</div>
        <div className="meta" style={{ marginTop: 6 }}>
          보낸·받은 도전장
        </div>
      </Link>

      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 700 }}>오스완</div>
        <div className="meta" style={{ marginTop: 6, lineHeight: 1.5 }}>
          오늘 스쿼트 완료.
          <br />
          영상은 서버로 전송되지 않아요. 개수·닉네임만 동기화됩니다.
        </div>
      </div>
    </div>
  );
}
