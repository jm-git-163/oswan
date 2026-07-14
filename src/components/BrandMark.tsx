/** Oswan brand mark — squat stance + optional raster logo */
export function BrandMark({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      className={className}
      src="/icon-192.png"
      width={size}
      height={size}
      alt=""
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.22),
        display: 'block',
        border: '1.5px solid rgba(200,245,74,0.55)',
        background: '#1E1E1E',
        objectFit: 'cover',
        flexShrink: 0,
      }}
    />
  );
}

export function BrandHeader({
  size = 'md',
  showTagline = true,
}: {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}) {
  const mark = size === 'lg' ? 64 : size === 'sm' ? 40 : 52;
  const title = size === 'lg' ? 40 : size === 'sm' ? 24 : 30;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <BrandMark size={mark} />
      <div>
        <div
          style={{
            fontWeight: 800,
            fontSize: title,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
          }}
        >
          오스완
        </div>
        {showTagline && (
          <div
            style={{
              marginTop: 6,
              fontSize: size === 'sm' ? 13 : 15,
              color: 'var(--accent)',
              fontWeight: 700,
            }}
          >
            오늘 스쿼트 완료
          </div>
        )}
      </div>
    </div>
  );
}
