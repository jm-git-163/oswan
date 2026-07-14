import { useState } from 'react';
import { createSoftUser } from '../lib/storage';
import { useAppStore } from '../store';

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const [name, setName] = useState('');

  if (user) return <>{children}</>;

  return (
    <div className="page" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <p className="meta" style={{ letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
        Oswan
      </p>
      <h1 className="page-title">오스완</h1>
      <p className="meta" style={{ fontSize: 15, marginBottom: 32, lineHeight: 1.5 }}>
        오늘 스쿼트 완료.
        <br />
        가입 없이, 닉네임만으로 시작해요.
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="닉네임"
        maxLength={12}
        style={{
          width: '100%',
          padding: '16px 18px',
          borderRadius: 16,
          border: '1px solid var(--surface-3)',
          background: 'var(--surface-2)',
          fontSize: 16,
          marginBottom: 16,
          outline: 'none',
        }}
      />
      <button
        className="cta-primary"
        disabled={!name.trim()}
        onClick={() => setUser(createSoftUser(name))}
      >
        시작하기
      </button>
      <p className="meta" style={{ marginTop: 20, textAlign: 'center' }}>
        카메라 추정은 기기에서만 이뤄져요. 영상은 서버로 안 가요.
      </p>
    </div>
  );
}
