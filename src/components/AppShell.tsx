import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getLastTarget } from '../lib/sessionTarget';

function IconHome({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconHistory({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h10M4 17h14"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconChallenge({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 4h8v3a4 4 0 0 1-8 0V4Z"
        stroke="currentColor"
        strokeWidth={active ? 2.1 : 1.7}
        strokeLinejoin="round"
      />
      <path
        d="M12 11v9M9 20h6"
        stroke="currentColor"
        strokeWidth={active ? 2.1 : 1.7}
        strokeLinecap="round"
      />
      <path d="M5 7H3v2a3 3 0 0 0 3 3M19 7h2v2a3 3 0 0 1-3 3" stroke="currentColor" strokeWidth={active ? 2.1 : 1.7} strokeLinecap="round" />
    </svg>
  );
}

function IconMe({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth={active ? 2.1 : 1.7} />
      <path
        d="M5 19.5c1.6-3.2 4-4.8 7-4.8s5.4 1.6 7 4.8"
        stroke="currentColor"
        strokeWidth={active ? 2.1 : 1.7}
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconStart() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4v3M12 17v3M7.5 7.5 9.2 9.2M14.8 14.8l1.7 1.7M4 12h3M17 12h3M7.5 16.5l1.7-1.7M14.8 9.2l1.7-1.7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2.6" fill="currentColor" />
    </svg>
  );
}

const sideTabs = [
  { to: '/', label: '홈', end: true, Icon: IconHome },
  { to: '/history', label: '기록', end: false, Icon: IconHistory },
  { to: '/challenges', label: '도전', end: false, Icon: IconChallenge },
  { to: '/me', label: '나', end: false, Icon: IconMe },
] as const;

export function AppShell() {
  const loc = useLocation();
  const navigate = useNavigate();
  const immersive =
    loc.pathname.startsWith('/session') ||
    loc.pathname.startsWith('/result') ||
    loc.pathname.startsWith('/pride');

  const left = sideTabs.slice(0, 2);
  const right = sideTabs.slice(2);

  return (
    <div className={`app-shell${immersive ? ' immersive' : ''}`}>
      <Outlet />
      {!immersive && (
        <nav className="tab-bar" aria-label="메인 메뉴">
          {left.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {({ isActive }) => (
                <>
                  <span className="tab-icon">
                    <t.Icon active={isActive} />
                  </span>
                  <span>{t.label}</span>
                </>
              )}
            </NavLink>
          ))}

          <div className="tab-slot">
            <button
              type="button"
              className="fab-start"
              aria-label="스쿼트 시작"
              onClick={() => navigate(`/session?target=${getLastTarget(30)}`)}
            >
              <IconStart />
            </button>
          </div>

          {right.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {({ isActive }) => (
                <>
                  <span className="tab-icon">
                    <t.Icon active={isActive} />
                  </span>
                  <span>{t.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
