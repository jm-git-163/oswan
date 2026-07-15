import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrandHeader } from './BrandMark';
import { createSoftUser } from '../lib/storage';
import { useAppStore } from '../store';

type Step = 'guide' | 'profile';

const GUIDE_KEY = 'oswan_guide_seen';

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="overlay-close" aria-label="닫기" onClick={onClick}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

const guideSteps = [
  {
    title: '오늘 목표를 정해요',
    body: '개수만 고르면 준비 끝. 채우면 오스완.',
  },
  {
    title: '점이 원 안 → 앉아 일어서면 +1',
    body: '머리 점이 동그라미에 들어가면 카운트 시작. 내려갔다 올라올 때 1개.',
  },
  {
    title: '음악·응원은 기본 ON',
    body: '시작과 함께 켜져 있어요. 원치 않으면 화면 칩으로 끄면 됩니다.',
  },
  {
    title: '친구에게 도전 · 명예 걸기',
    body: '같은 목표 + 아아·자랑권 같은 약속을 붙이면 상대도 움직이기 쉬워요.',
  },
];

/** Soft-ID + guide gate — privacy is allowed without SoftUser. */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const location = useLocation();
  const fromChallenge = /^\/c\//.test(location.pathname);
  const isPublicLegal = location.pathname === '/privacy';

  const [step, setStep] = useState<Step>(() => {
    try {
      if (localStorage.getItem(GUIDE_KEY) === '1') return 'profile';
    } catch {
      /* ignore */
    }
    return fromChallenge ? 'profile' : 'guide';
  });
  const [name, setName] = useState('');

  useEffect(() => {
    if (fromChallenge) setStep('profile');
  }, [fromChallenge]);

  if (isPublicLegal || user) return <>{children}</>;

  function markGuideSeen() {
    try {
      localStorage.setItem(GUIDE_KEY, '1');
    } catch {
      /* ignore */
    }
  }

  function goProfile() {
    markGuideSeen();
    setStep('profile');
  }

  function finishWithName() {
    const trimmed = name.trim();
    if (!trimmed) return;
    markGuideSeen();
    setUser(createSoftUser(trimmed));
  }

  /** Close / skip: enter with guest Soft ID (can rename in 나). */
  function skipNow() {
    markGuideSeen();
    setUser(createSoftUser(fromChallenge ? '게스트' : '게스트'));
  }

  return (
    <div className="overlay-scrim" style={{ position: 'relative', minHeight: '100dvh' }}>
      <div className="overlay-card page-enter">
        {step === 'guide' ? (
          <>
            <CloseButton onClick={goProfile} />
            <p className="meta" style={{ letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              Oswan
            </p>
            <h1 className="page-title" style={{ marginTop: 8 }}>
              처음이신가요?
            </h1>
            <p className="meta" style={{ fontSize: 14, lineHeight: 1.55, marginBottom: 16 }}>
              오늘 스쿼트 완료. 가입 없이, 닉네임만으로 가볍게 시작해요.
            </p>
            <div className="stack-sm" style={{ marginBottom: 20 }}>
              {guideSteps.map((s, i) => (
                <div key={s.title} className="guide-step">
                  <span className="guide-step__num">{i + 1}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{s.title}</div>
                    <div className="meta" style={{ marginTop: 4, lineHeight: 1.45 }}>
                      {s.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="cta-accent" onClick={goProfile}>
              다음: 닉네임 입력
            </button>
          </>
        ) : (
          <>
            <CloseButton onClick={skipNow} />
            <BrandHeader size="md" />
            {fromChallenge ? (
              <>
                <p className="meta" style={{ letterSpacing: '0.1em', marginTop: 20 }}>
                  CHALLENGE
                </p>
                <h1 className="page-title" style={{ marginTop: 8 }}>
                  내 이름으로 도전 수락
                </h1>
                <p className="meta" style={{ fontSize: 14, margin: '12px 0 20px', lineHeight: 1.55 }}>
                  보낸 사람과 <strong style={{ color: '#fff' }}>기록이 따로</strong> 쌓이도록
                  닉네임만 입력하면 바로 도전장으로 가요.
                </p>
              </>
            ) : (
              <>
                <h1 className="page-title" style={{ marginTop: 18 }}>
                  닉네임으로 시작
                </h1>
                <p className="meta" style={{ fontSize: 14, margin: '8px 0 20px', lineHeight: 1.5 }}>
                  목표 개수 채우면 오스완.
                </p>
              </>
            )}
            <label className="meta">
              닉네임
              <input
                className="field-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={fromChallenge ? '내 닉네임' : '닉네임'}
                maxLength={12}
                autoFocus
              />
            </label>
            <button
              type="button"
              className="cta-primary"
              style={{ marginTop: 16 }}
              disabled={!name.trim()}
              onClick={finishWithName}
            >
              {fromChallenge ? '도전장 열기' : '시작하기'}
            </button>
            <button
              type="button"
              className="meta"
              style={{
                display: 'block',
                width: '100%',
                marginTop: 14,
                textAlign: 'center',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
              onClick={skipNow}
            >
              나중에 하기
            </button>
            <p className="meta" style={{ marginTop: 18, textAlign: 'center', lineHeight: 1.45 }}>
              카메라 추정은 기기에서만 · 영상은 서버로 안 가요.
              <br />
              <Link to="/privacy" className="mute-link">
                개인정보처리방침
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
