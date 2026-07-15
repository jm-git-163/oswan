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
}: {
  value: ReactNode;
  label: string;
  hint?: ReactNode;
}) {
  return (
    <div>
      <div className="hero-num" style={{ fontSize: 'clamp(56px, 16vw, 72px)' }}>
        {value}
      </div>
      <div className="meta" style={{ marginTop: 8 }}>
        {label}
      </div>
      {hint}
    </div>
  );
}
