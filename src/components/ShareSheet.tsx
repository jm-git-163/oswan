import { useEffect, useRef, useState } from 'react';
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
  challengeShareText,
  openKakaoWithCopiedText,
  openSmsShare,
  openTelegramShare,
  renderChallengeCardBlob,
  shareChallengeInvite,
} from '../lib/share';

type Props = {
  open: boolean;
  challenge: Challenge;
  onClose: () => void;
};

/** Always shown when sending a challenge — link-first so friends can accept & squat. */
export function ShareSheet({ open, challenge, onClose }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [fileReady, setFileReady] = useState(false);
  const fileRef = useRef<File | null>(null);
  const native = canNativeShare();
  const inApp = isLikelyInAppBrowser();
  const kakao = isKakaoInAppBrowser();

  useEffect(() => {
    if (!open) return;
    let alive = true;
    let objectUrl: string | null = null;
    fileRef.current = null;
    setFileReady(false);
    setStatus(null);
    void (async () => {
      try {
        const blob = await renderChallengeCardBlob(challenge);
        const file = new File([blob], `oswan-${challenge.targetReps}.png`, { type: 'image/png' });
        objectUrl = URL.createObjectURL(blob);
        if (!alive) return;
        fileRef.current = file;
        setFileReady(true);
        setPreview(objectUrl);
      } catch {
        if (alive) setPreview('/og-challenge.png');
      }
    })();
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, challenge]);

  if (!open) return null;

  const url = challengeShareUrl(challenge);
  const text = challengeShareText(challenge, url);

  const sendLink = () => {
    setBusy(true);
    setStatus(null);
    void (async () => {
      if (inApp) {
        const copied = await navigator.clipboard.writeText(text).then(() => true).catch(() => false);
        setBusy(false);
        setStatus(
          copied
            ? '카톡 안 브라우저에서는 공유가 막혀요. 문구를 복사했어요 — Chrome에서 오스완을 연 뒤 다시 보내 주세요.'
            : '카톡 안 브라우저에서는 공유가 막혀요. 아래 「Chrome에서 열기」를 눌러 주세요.',
        );
        return;
      }
      const r = await shareChallengeInvite(challenge, { preferImage: false });
      setBusy(false);
      if (r === 'shared') {
        onClose();
        return;
      }
      if (r === 'cancelled') {
        setStatus('공유가 취소됐어요. 다시 눌러 주세요.');
        return;
      }
      const k = await openKakaoWithCopiedText(text);
      setStatus(
        k === 'opened'
          ? '도전 링크를 복사했고 카카오톡을 열었어요. 채팅에 붙여넣기 하세요.'
          : '도전 링크를 복사했어요. 카톡에 붙여넣기 하세요.',
      );
    })();
  };

  const sendImage = () => {
    setBusy(true);
    setStatus(null);
    void (async () => {
      const r = await shareChallengeInvite(challenge, {
        preparedFile: fileRef.current,
        preferImage: true,
      });
      setBusy(false);
      if (r === 'shared') {
        onClose();
        return;
      }
      if (r === 'cancelled') {
        setStatus('공유가 취소됐어요.');
        return;
      }
      setStatus('이미지 공유에 실패했어요. 「링크로 보내기」를 써 주세요.');
    })();
  };

  const openChrome = () => {
    void openInExternalBrowser(window.location.origin + '/');
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
              링크로 보내야 상대가 수락·스쿼트 가능
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
            {kakao ? '카카오톡' : '앱 안'} 브라우저에서는 도전장 보내기·카메라가 잘 안 됩니다.
            <button className="cta-primary" style={{ marginTop: 10 }} onClick={openChrome}>
              Chrome / Safari에서 열기
            </button>
          </div>
        )}

        {preview && (
          <img
            src={preview}
            alt="도전장 미리보기"
            style={{
              width: '100%',
              borderRadius: 16,
              marginBottom: 14,
              border: '1px solid rgba(200,245,74,0.25)',
              aspectRatio: '4/5',
              objectFit: 'cover',
              background: '#111',
            }}
          />
        )}

        <p style={{ fontWeight: 700, marginBottom: 4 }}>
          {challenge.fromNickname} · {challenge.targetReps}개 도전
        </p>
        <p className="meta" style={{ marginBottom: 10, lineHeight: 1.45, wordBreak: 'break-all', fontSize: 12 }}>
          {url}
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
            }}
          >
            {status}
          </div>
        )}

        <div style={{ display: 'grid', gap: 8 }}>
          <button className="cta-primary" disabled={busy} onClick={sendLink}>
            {busy ? '여는 중…' : native ? '카톡·메신저로 링크 보내기' : '링크 복사 후 카톡 열기'}
          </button>
          <button className="cta-secondary" disabled={busy || !fileReady} onClick={sendImage}>
            썸네일 이미지도 함께 (선택)
          </button>
          <button
            className="cta-secondary"
            onClick={() => {
              openSmsShare(text);
            }}
          >
            문자로 링크 보내기
          </button>
          <button
            className="cta-secondary"
            onClick={() => {
              openTelegramShare(url, text);
            }}
          >
            텔레그램으로 보내기
          </button>
          <button
            className="cta-secondary"
            onClick={() => void navigator.clipboard.writeText(text).then(() => setStatus('링크·문구를 복사했어요.'))}
          >
            링크만 복사
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
              향후 오스완 앱 출시 시 · 앱 설치 후 도전 시작 안내 예정
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
