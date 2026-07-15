import { Link } from 'react-router-dom';
import type { CSSProperties, ReactNode } from 'react';

export function SurfaceCard({
  children,
  className = '',
  accent = false,
  as: Tag = 'div',
  to,
  style,
}: {
  children: ReactNode;
  className?: string;
  accent?: boolean;
  as?: 'div' | 'article' | 'section';
  to?: string;
  style?: CSSProperties;
}) {
  const cls = `surface-card${accent ? ' surface-card--accent' : ''}${className ? ` ${className}` : ''}`;
  if (to) {
    return (
      <Link to={to} className={cls} style={{ display: 'block', textDecoration: 'none', color: 'inherit', ...style }}>
        {children}
      </Link>
    );
  }
  return (
    <Tag className={cls} style={style}>
      {children}
    </Tag>
  );
}

export function HeroStat({
  value,
  label,
  hint,
  unit,
}: {
  value: ReactNode;
  label: string;
  hint?: ReactNode;
  /** e.g. ‘개’ — rendered next to the big number so units stay clear */
  unit?: string;
}) {
  return (
    <div>
      <div
        className="hero-num"
        style={{
          fontSize: 'clamp(56px, 16vw, 72px)',
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
        }}
      >
        {value}
        {unit ? (
          <span
            style={{
              fontSize: 'clamp(18px, 5vw, 24px)',
              fontWeight: 700,
              color: 'var(--text-secondary, var(--text-tertiary))',
              letterSpacing: '-0.02em',
            }}
          >
            {unit}
          </span>
        ) : null}
      </div>
      <div className="meta" style={{ marginTop: 8 }}>
        {label}
      </div>
      {hint}
    </div>
  );
}
