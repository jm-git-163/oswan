/** Oswan brand mark — squat stance in rounded plate */
export function BrandMark({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
    >
      <rect x="2" y="2" width="60" height="60" rx="14" fill="#1E1E1E" stroke="#C8F54A" strokeWidth="2.5" />
      <circle cx="32" cy="16" r="5.5" stroke="#C8F54A" strokeWidth="2.2" />
      <path
        d="M32 22.5v12M32 34.5 20 48M32 34.5 44 48M32 28 21 36M32 28 43 36"
        stroke="#C8F54A"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandHeader({
  size = 'md',
  showTagline = true,
}: {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}) {
  const mark = size === 'lg' ? 56 : size === 'sm' ? 32 : 44;
  const title = size === 'lg' ? 36 : size === 'sm' ? 22 : 28;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <BrandMark size={mark} />
      <div>
        <div
          style={{
            fontWeight: 800,
            fontSize: title,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}
        >
          오스완
        </div>
        {showTagline && (
          <div
            className="meta"
            style={{
              marginTop: 4,
              fontSize: size === 'sm' ? 12 : 13,
              color: 'var(--accent)',
              fontWeight: 600,
            }}
          >
            오늘 스쿼트 완료
          </div>
        )}
      </div>
    </div>
  );
}
