import { useEffect, useRef, useState } from 'react';
import { BrandMark } from './BrandMark';
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

/** Always shown when sending a challenge — never silent clipboard-only. */
export function ShareSheet({ open, challenge, onClose }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [fileReady, setFileReady] = useState(false);
  const fileRef = useRef<File | null>(null);
  const native = canNativeShare();

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

  const sendToMessenger = () => {
    // 클릭 핸들러에서 await 없이 바로 share 시작 → 제스처 유지
    setBusy(true);
    setStatus(null);
    void (async () => {
      const r = await shareChallengeInvite(challenge, {
        preparedFile: fileRef.current,
      });
      setBusy(false);
      if (r === 'shared') {
        onClose();
        return;
      }
      if (r === 'cancelled') {
        setStatus('공유가 취소됐어요. 다시 눌러 주세요.');
        return;
      }
      // native share 실패/미지원 → 카톡 앱 실행 + 클립보드
      const k = await openKakaoWithCopiedText(text);
      setStatus(
        k === 'opened'
          ? '도전장 문구를 복사했고 카카오톡을 열었어요. 채팅창에 붙여넣기 하세요.'
          : '도전장 문구를 복사했어요. 카카오톡을 열고 붙여넣기 하세요.',
      );
    })();
  };

  const sendKakao = () => {
    void (async () => {
      const k = await openKakaoWithCopiedText(text);
      setStatus(
        k === 'opened'
          ? '복사 완료 · 카카오톡에서 붙여넣기'
          : '복사 완료 · 카카오톡을 열고 붙여넣기',
      );
    })();
  };

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setStatus('도전장 문구+링크를 복사했어요.');
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
              오스완 · 오늘 스쿼트 완료
            </div>
          </div>
        </div>

        {preview && (
          <img
            src={preview}
            alt="도전장 썸네일"
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
        <p className="meta" style={{ marginBottom: 14, lineHeight: 1.45 }}>
          {native
            ? fileReady
              ? '썸네일 준비됨 · 아래 버튼으로 카톡·메신저를 고르세요.'
              : '썸네일 만드는 중… 곧 보낼 수 있어요.'
            : '이 브라우저는 공유창이 없어요. 카카오톡 버튼으로 복사 후 붙여넣기 하세요.'}
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
          {native ? (
            <button className="cta-primary" disabled={busy} onClick={sendToMessenger}>
              {busy ? '여는 중…' : '카톡·메신저로 보내기'}
            </button>
          ) : (
            <button className="cta-primary" onClick={sendKakao}>
              카카오톡으로 보내기 (복사→붙여넣기)
            </button>
          )}
          <button className="cta-secondary" onClick={sendKakao}>
            카카오톡 앱 열기
          </button>
          <button
            className="cta-secondary"
            onClick={() => {
              openSmsShare(text);
            }}
          >
            문자로 보내기
          </button>
          <button
            className="cta-secondary"
            onClick={() => {
              openTelegramShare(url, text);
            }}
          >
            텔레그램으로 보내기
          </button>
          <button className="cta-secondary" onClick={() => void copy()}>
            문구·링크만 복사
          </button>
          <button className="cta-secondary" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
