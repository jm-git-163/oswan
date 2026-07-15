import { useState } from 'react';
import { BrandMark } from './BrandMark';
import {
  isKakaoInAppBrowser,
  isLikelyInAppBrowser,
  NATIVE_APP,
  openInExternalBrowser,
} from '../lib/browser';
import type { Challenge } from '../lib/types';
import { challengeShareUrl } from '../lib/storage';
import {
  canNativeShare,
  challengeShareCaption,
  challengeShareText,
  openKakaoWithCopiedText,
  openSmsShare,
  openTelegramShare,
  shareChallengeInvite,
} from '../lib/share';

type Props = {
  open: boolean;
  challenge: Challenge;
  onClose: () => void;
};

/**
 * Share challenge as URL → messenger OG thumbnail card (tappable).
 * No image-only share (photos are not links).
 */
export function ShareSheet({ open, challenge, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const native = canNativeShare();
  const inApp = isLikelyInAppBrowser();
  const kakao = isKakaoInAppBrowser();

  if (!open) return null;

  const url = challengeShareUrl(challenge);
  const caption = challengeShareCaption(challenge);
  const smsBody = challengeShareText(challenge, url);

  const sendChallenge = () => {
    setBusy(true);
    setStatus(null);
    void (async () => {
      if (inApp) {
        const copied = await navigator.clipboard.writeText(url).then(() => true).catch(() => false);
        setBusy(false);
        setStatus(
          copied
            ? '카톡 안에서는 공유가 막혀요. 링크를 복사했어요 — Chrome에서 열고 다시 보내 주세요. 붙여넣으면 썸네일 카드로 보여요.'
            : '카톡 안에서는 공유가 막혀요. 「Chrome에서 열기」를 눌러 주세요.',
        );
        return;
      }
      const r = await shareChallengeInvite(challenge);
      setBusy(false);
      if (r === 'shared') {
        onClose();
        return;
      }
      if (r === 'cancelled') {
        setStatus('공유가 취소됐어요. 다시 눌러 주세요.');
        return;
      }
      // Fallback: URL only → Kakao paste builds OG card
      const k = await openKakaoWithCopiedText(url);
      setStatus(
        k === 'opened'
          ? '링크를 복사했고 카카오톡을 열었어요. 채팅에 붙여넣으면 썸네일 카드가 떠요.'
          : '링크를 복사했어요. 카톡에 붙여넣으면 썸네일 카드가 떠요.',
      );
    })();
  };

  const openChrome = () => {
    void openInExternalBrowser(url);
  };

  return (
    <div
      role="dialog"
      aria-modal
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: 'rgba(0,0,0,0.78)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 24,
          padding: 20,
          marginBottom: 8,
          maxHeight: '90dvh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <BrandMark size={40} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>도전장 보내기</div>
            <div className="meta" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              썸네일 카드 · 누르면 도전 연결
            </div>
          </div>
        </div>

        {inApp && (
          <div
            className="card"
            style={{
              marginBottom: 12,
              border: '1px solid var(--warn)',
              color: 'var(--warn)',
              fontSize: 13,
              lineHeight: 1.45,
              padding: 12,
            }}
          >
            {kakao ? '카카오톡' : '앱 안'} 브라우저에서는 보내기·카메라가 제한돼요.
            <button className="cta-primary" style={{ marginTop: 10 }} onClick={openChrome}>
              Chrome에서 도전 열기
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={sendChallenge}
          disabled={busy}
          style={{
            display: 'block',
            width: '100%',
            padding: 0,
            border: '1px solid rgba(200,245,74,0.35)',
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 12,
            background: '#111',
            textAlign: 'left',
          }}
        >
          <img
            src="/og-challenge.png"
            alt="도전장 썸네일 미리보기"
            style={{
              width: '100%',
              aspectRatio: '1.91/1',
              objectFit: 'cover',
              display: 'block',
            }}
          />
          <div style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.55)' }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>오스완 도전장</div>
            <div className="meta" style={{ marginTop: 4, fontSize: 12 }}>
              {challenge.fromNickname} · {challenge.targetReps}개 · 눌러서 수락
            </div>
          </div>
        </button>

        <p className="meta" style={{ marginBottom: 12, fontSize: 13, lineHeight: 1.5 }}>
          카톡·메신저에는 <strong style={{ color: 'var(--accent)' }}>링크 주소 대신 썸네일 카드</strong>로
          보여요. 상대가 카드를 누르면 도전으로 연결됩니다.
        </p>

        {status && (
          <div
            className="card"
            style={{
              marginBottom: 12,
              fontSize: 13,
              color: 'var(--accent)',
              border: '1px solid rgba(200,245,74,0.35)',
              padding: 12,
              lineHeight: 1.45,
            }}
          >
            {status}
          </div>
        )}

        <div style={{ display: 'grid', gap: 8 }}>
          <button className="cta-primary" disabled={busy} onClick={sendChallenge}>
            {busy ? '여는 중…' : native ? '카톡·메신저로 도전 보내기' : '링크 복사 후 카톡 열기'}
          </button>
          <button
            className="cta-secondary"
            onClick={() => {
              openSmsShare(smsBody);
            }}
          >
            문자로 보내기
          </button>
          <button
            className="cta-secondary"
            onClick={() => {
              openTelegramShare(url, caption);
            }}
          >
            텔레그램으로 보내기
          </button>
          <button
            className="cta-secondary"
            onClick={() =>
              void navigator.clipboard.writeText(url).then(() =>
                setStatus('링크를 복사했어요. 카톡에 붙여넣으면 썸네일 카드로 보여요.'),
              )
            }
          >
            링크 복사 (붙여넣기용)
          </button>

          {NATIVE_APP.available ? (
            <a
              className="cta-secondary"
              href={/iPhone|iPad/i.test(navigator.userAgent) ? NATIVE_APP.iosUrl : NATIVE_APP.androidUrl}
              style={{ textAlign: 'center' }}
            >
              {NATIVE_APP.label}
            </a>
          ) : (
            <div className="meta" style={{ textAlign: 'center', fontSize: 12, padding: '8px 0' }}>
              향후 오스완 앱 출시 시 · 앱에서 도전 시작 안내 예정
            </div>
          )}

          <button className="cta-secondary" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
