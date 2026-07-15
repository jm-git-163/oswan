import { useState } from 'react';
import { MODEL_SQUAT_EMBED_URL, MODEL_SQUAT_WATCH_URL } from '../lib/modelSquat';

type Props = {
  /** compact = 홈 / gate = 카메라 허용 전 */
  variant?: 'compact' | 'gate';
};

/** Collapsed by default — open only when the user wants the example. */
export function ModelSquatExample({ variant = 'compact' }: Props) {
  const [open, setOpen] = useState(false);
  const gate = variant === 'gate';

  return (
    <div style={{ marginBottom: gate ? 16 : 0 }}>
      <button
        type="button"
        className="cta-secondary"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          textAlign: 'left',
          padding: '12px 16px',
        }}
      >
        <span>
          <span style={{ fontWeight: 700 }}>모범 스쿼트 예시</span>
          <span className="meta" style={{ display: 'block', marginTop: 2, fontSize: 12, wordBreak: 'keep-all' }}>
            {open ? '접기' : '안전하고 효과적인 스쿼트를 위해 시청을 권장해요'}
          </span>
        </span>
        <span style={{ color: 'var(--accent)', fontWeight: 800, fontSize: 18 }}>{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div
          className="card"
          style={{
            marginTop: 10,
            padding: 0,
            overflow: 'hidden',
            border: '1px solid rgba(200,245,74,0.22)',
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span className="meta" style={{ fontSize: 12 }}>
              보고 따라 하세요
            </span>
            <a
              href={MODEL_SQUAT_WATCH_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="meta"
              style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 12 }}
              onClick={(e) => e.stopPropagation()}
            >
              YouTube ↗
            </a>
          </div>
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '9 / 16',
              maxHeight: gate ? '40dvh' : 280,
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
      )}
    </div>
  );
}
