import { BrandMark } from './BrandMark';
import type { Challenge } from '../lib/types';
import { challengeShareUrl } from '../lib/storage';
import { challengeShareText, openSmsShare, openTelegramShare, shareChallengeInvite } from '../lib/share';

type Props = {
  open: boolean;
  challenge: Challenge;
  onClose: () => void;
};

/** Desktop / 미지원 브라우저용 — 메신저 채널 선택 */
export function ShareSheet({ open, challenge, onClose }: Props) {
  if (!open) return null;
  const url = challengeShareUrl(challenge);
  const text = challengeShareText(challenge, url);

  const again = async () => {
    // 시트에서 다시 누르면 도전장 이미지 첨부를 우선 시도
    const r = await shareChallengeInvite(challenge, { withImage: true });
    if (r === 'shared' || r === 'cancelled') onClose();
  };

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: 'rgba(0,0,0,0.72)',
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
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <BrandMark size={36} />
          <div>
            <div style={{ fontWeight: 800 }}>도전장 보내기</div>
            <div className="meta" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              오스완 · 오늘 스쿼트 완료
            </div>
          </div>
        </div>
        <p className="meta" style={{ marginBottom: 16, lineHeight: 1.45 }}>
          카톡·메시지 등 메신저를 고르면 도전장이 바로 전달돼요.
        </p>

        <div style={{ display: 'grid', gap: 8 }}>
          <button className="cta-primary" onClick={() => void again()}>
            메신저 앱 선택하기
          </button>
          <button
            className="cta-secondary"
            onClick={() => {
              openSmsShare(text);
              onClose();
            }}
          >
            문자로 보내기
          </button>
          <button
            className="cta-secondary"
            onClick={() => {
              openTelegramShare(url, text);
              onClose();
            }}
          >
            텔레그램으로 보내기
          </button>
          <button className="cta-secondary" onClick={() => void copy()}>
            링크만 복사
          </button>
          <button className="cta-secondary" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
