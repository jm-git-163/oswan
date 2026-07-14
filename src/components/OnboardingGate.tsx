import { useState } from 'react';
import { BrandHeader } from './BrandMark';
import { createSoftUser } from '../lib/storage';
import { useAppStore } from '../store';

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const [name, setName] = useState('');

  if (user) return <>{children}</>;

  return (
    <div className="page" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <BrandHeader size="lg" />
      <p className="meta" style={{ fontSize: 15, margin: '28px 0 32px', lineHeight: 1.5 }}>
        목표 개수 채우면 오스완.
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
