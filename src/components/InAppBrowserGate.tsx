import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BrandMark } from './BrandMark';
import {
  isKakaoInAppBrowser,
  isLikelyInAppBrowser,
  NATIVE_APP,
  openInExternalBrowser,
} from '../lib/browser';

/**
 * Full-screen gate when opened inside Kakao/Line WebView.
 * Challenge accept + camera need Chrome/Safari.
 */
export function InAppBrowserGate({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState<string | null>(null);

  useEffect(() => {
    if (loc.pathname === '/privacy') {
      setShow(false);
      return;
    }
    setShow(isLikelyInAppBrowser());
  }, [loc.pathname]);

  if (!show) return <>{children}</>;

  const kakao = isKakaoInAppBrowser();
  const onChallenge = loc.pathname.startsWith('/c/');

  const openChrome = async () => {
    const result = await openInExternalBrowser(window.location.href);
    if (result.method === 'ios-copy') {
      setIosHint(
        result.copied
          ? '링크를 복사했어요. Safari를 열고 주소창에 붙여넣기 하세요.'
          : 'Safari를 연 뒤 주소창에 oswan.vercel.app 을 입력하세요.',
      );
    }
  };

  return (
    <>
      {children}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          background: 'rgba(10,10,10,0.94)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <BrandMark size={56} />
        <h1 className="page-title" style={{ marginTop: 16, fontSize: 26 }}>
          {kakao ? '카카오톡 브라우저에서는 제한돼요' : '앱 안 브라우저에서는 제한돼요'}
        </h1>
        <p className="meta" style={{ marginTop: 12, fontSize: 15, lineHeight: 1.55 }}>
          {onChallenge
            ? '도전 수락·카메라 스쿼트는 Chrome 또는 Safari에서 해야 해요.'
            : '도전장 보내기와 카메라는 Chrome 또는 Safari에서 안정적으로 작동해요.'}
        </p>
        <button className="cta-primary" style={{ marginTop: 24 }} onClick={() => void openChrome()}>
          Chrome / Safari에서 열기
        </button>
        {iosHint && (
          <p className="meta" style={{ marginTop: 14, color: 'var(--accent)', lineHeight: 1.45 }}>
            {iosHint}
          </p>
        )}
        {onChallenge && (
          <p className="meta" style={{ marginTop: 12, fontSize: 13, lineHeight: 1.45 }}>
            외부 브라우저에서 열어야 닉네임 수락 → 카메라 스쿼트가 원활해요.
          </p>
        )}
        {NATIVE_APP.available ? (
          <a
            className="cta-secondary"
            style={{ marginTop: 10, textAlign: 'center' }}
            href={/iPhone|iPad/i.test(navigator.userAgent) ? NATIVE_APP.iosUrl : NATIVE_APP.androidUrl}
          >
            {NATIVE_APP.label}
          </a>
        ) : (
          <p className="meta" style={{ marginTop: 16, fontSize: 12, textAlign: 'center' }}>
            곧 오스완 앱이 나오면 앱 설치 후 바로 시작할 수 있어요.
          </p>
        )}
        {!onChallenge && (
          <button
            className="cta-secondary"
            style={{ marginTop: 10 }}
            onClick={() => setShow(false)}
          >
            일단 여기서 계속 (기능 제한 가능)
          </button>
        )}
        {onChallenge && (
          <button
            className="cta-secondary"
            style={{ marginTop: 10 }}
            onClick={() => setShow(false)}
          >
            제한을 이해하고 여기서 계속
          </button>
        )}
      </div>
    </>
  );
}
