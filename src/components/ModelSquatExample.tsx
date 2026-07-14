import { MODEL_SQUAT_EMBED_URL, MODEL_SQUAT_WATCH_URL } from '../lib/modelSquat';

type Props = {
  /** compact = 홈 카드 / gate = 카메라 허용 전 전체폭 */
  variant?: 'compact' | 'gate';
};

export function ModelSquatExample({ variant = 'compact' }: Props) {
  const tall = variant === 'gate';

  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: 'hidden',
        marginBottom: tall ? 20 : 0,
        border: '1px solid rgba(200,245,74,0.22)',
      }}
    >
      <div
        style={{
          padding: '12px 14px 10px',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>모범 스쿼트 예시</div>
          <div className="meta" style={{ marginTop: 2, fontSize: 12 }}>
            보고 바로 따라 하세요
          </div>
        </div>
        <a
          href={MODEL_SQUAT_WATCH_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="meta"
          style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 12, flexShrink: 0 }}
        >
          YouTube ↗
        </a>
      </div>

      <div
        style={{
          position: 'relative',
          width: '100%',
          // Shorts 비율에 가깝게, 게이트에서는 조금 더 크게
          aspectRatio: '9 / 16',
          maxHeight: tall ? '36dvh' : 260,
          margin: '0 auto',
          background: '#000',
        }}
      >
        <iframe
          title="모범 스쿼트 예시"
          src={MODEL_SQUAT_EMBED_URL}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 0,
          }}
        />
      </div>
    </div>
  );
}
