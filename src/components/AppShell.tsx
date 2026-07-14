import { NavLink, Outlet, useLocation } from 'react-router-dom';

const tabs = [
  { to: '/', label: '홈', end: true },
  { to: '/history', label: '기록' },
  { to: '/ranking', label: '랭킹' },
  { to: '/me', label: '나' },
];

export function AppShell() {
  const loc = useLocation();
  const immersive =
    loc.pathname.startsWith('/session') ||
    loc.pathname.startsWith('/result') ||
    loc.pathname.startsWith('/pride');

  return (
    <div className={`app-shell${immersive ? ' immersive' : ''}`}>
      <Outlet />
      {!immersive && (
        <nav className="tab-bar">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <span>{t.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
