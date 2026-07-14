import { useState } from 'react';
import { BrandMark } from './BrandMark';
import { isLikelyInAppBrowser, openInExternalBrowser } from '../lib/browser';
import {
  canShareVideoFile,
  copyPrideCaption,
  downloadPrideFile,
  openInstagram,
  openYouTubeStudio,
  sharePrideVideo,
} from '../video/sharePride';

type Props = {
  open: boolean;
  file: File | null;
  caption: string;
  onClose: () => void;
};

/** Sheet to push composed squat video to Kakao / Instagram / etc. */
export function PrideShareSheet({ open, file, caption, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const inApp = isLikelyInAppBrowser();
  const canFile = file ? canShareVideoFile(file) : false;

  if (!open || !file) return null;

  const shareNative = () => {
    setBusy(true);
    setStatus(null);
    void (async () => {
      const r = await sharePrideVideo(file, caption);
      setBusy(false);
      setStatus(r.message);
      if (r.outcome === 'shared') {
        // keep sheet open briefly so user sees confirmation, or close
        window.setTimeout(() => onClose(), 600);
      }
    })();
  };

  const saveAndCaption = async () => {
    downloadPrideFile(file);
    const ok = await copyPrideCaption(caption);
    setStatus(
      ok
        ? '저장·캡션 복사 완료. SNS에서 갤러리 영상만 고르면 돼요.'
        : '영상을 저장했어요. 캡션은 아래 문구를 길게 눌러 복사하세요.',
    );
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
            <div style={{ fontWeight: 800, fontSize: 18 }}>SNS로 올리기</div>
            <div className="meta" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              카톡 · 인스타 · 유튜브 등
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
              padding: 12,
            }}
          >
            카톡 안 브라우저에서는 영상 공유가 막혀요.
            <button
              className="cta-primary"
              style={{ marginTop: 10 }}
              onClick={() => void openInExternalBrowser()}
            >
              Chrome에서 열기
            </button>
          </div>
        )}

        <p className="meta" style={{ marginBottom: 12, lineHeight: 1.45, fontSize: 13 }}>
          {canFile
            ? '아래 버튼을 누르면 공유창이 열려요. 카톡·인스타·드라이브 등을 고르세요.'
            : '이 브라우저는 바로 공유가 어려워요. 저장 후 SNS에서 갤러리로 첨부하세요.'}
        </p>

        <div
          className="card"
          style={{
            marginBottom: 12,
            fontSize: 12,
            lineHeight: 1.45,
            color: 'var(--text-secondary)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {caption}
        </div>

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
          <button className="cta-primary" disabled={busy || inApp} onClick={shareNative}>
            {busy ? '여는 중…' : canFile ? '카톡·인스타 등 공유하기' : '공유 시도 / 저장'}
          </button>
          <button className="cta-secondary" onClick={() => void saveAndCaption()}>
            저장 + 캡션 복사 (첨부용)
          </button>
          <button
            className="cta-secondary"
            onClick={() => {
              downloadPrideFile(file);
              void copyPrideCaption(caption).then(() => {
                openInstagram();
                setStatus('저장·캡션 복사 후 인스타를 열었어요. 새 게시물 → 방금 저장한 영상을 고르세요.');
              });
            }}
          >
            인스타그램으로 올리기
          </button>
          <button
            className="cta-secondary"
            onClick={() => {
              downloadPrideFile(file);
              void copyPrideCaption(caption).then(() => {
                openYouTubeStudio();
                setStatus('저장·캡션 복사 후 유튜브를 열었어요. 업로드에서 방금 저장한 영상을 고르세요.');
              });
            }}
          >
            유튜브 쇼츠로 올리기
          </button>
          <button
            className="cta-secondary"
            onClick={() =>
              void copyPrideCaption(caption).then((ok) =>
                setStatus(ok ? '캡션을 복사했어요.' : '복사에 실패했어요.'),
              )
            }
          >
            캡션만 복사
          </button>
          <button className="cta-secondary" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
