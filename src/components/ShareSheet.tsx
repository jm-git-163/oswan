import { useEffect, useState } from 'react';
import { BrandMark } from './BrandMark';
import type { Challenge } from '../lib/types';
import { challengeShareUrl } from '../lib/storage';
import {
  challengeShareText,
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

  useEffect(() => {
    if (!open) return;
    let alive = true;
    let url: string | null = null;
    void (async () => {
      try {
        const blob = await renderChallengeCardBlob(challenge);
        url = URL.createObjectURL(blob);
        if (alive) setPreview(url);
      } catch {
        if (alive) setPreview('/og-challenge.png');
      }
    })();
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [open, challenge]);

  if (!open) return null;

  const url = challengeShareUrl(challenge);
  const text = challengeShareText(challenge, url);

  const sendToMessenger = async () => {
    setBusy(true);
    setStatus(null);
    const r = await shareChallengeInvite(challenge, { withImage: true });
    setBusy(false);
    if (r === 'shared') {
      onClose();
      return;
    }
    if (r === 'cancelled') {
      setStatus('공유가 취소됐어요. 다시 눌러 주세요.');
      return;
    }
    setStatus('이 기기에서 메신저 공유창이 안 열려요. 아래 문자/텔레그램을 쓰거나 링크를 복사하세요.');
  };

  const copy = async () => {
    await navigator.clipboard.writeText(`${text}`);
    setStatus('도전장 문구+링크를 복사했어요. 카톡에 붙여넣기 하세요.');
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
          아래 버튼을 누르면 카톡·메시지 등 앱 선택창이 뜹니다. 썸네일 이미지와 링크가 함께 갑니다.
        </p>

        {status && (
          <div
            className="card"
            style={{
              marginBottom: 12,
              fontSize: 13,
              color: 'var(--warn)',
              border: '1px solid var(--warn)',
              padding: 12,
            }}
          >
            {status}
          </div>
        )}

        <div style={{ display: 'grid', gap: 8 }}>
          <button className="cta-primary" disabled={busy} onClick={() => void sendToMessenger()}>
            {busy ? '준비 중…' : '카톡·메신저로 보내기'}
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
            문구·링크 복사 (최후 수단)
          </button>
          <button className="cta-secondary" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
