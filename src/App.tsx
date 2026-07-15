import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { InAppBrowserGate } from './components/InAppBrowserGate';
import { OnboardingGate } from './components/OnboardingGate';
import { ChallengesPage } from './pages/ChallengesPage';
import { ChallengePage } from './pages/ChallengePage';
import { HistoryPage } from './pages/HistoryPage';
import { HomePage } from './pages/HomePage';
import { MePage } from './pages/MePage';
import { PrivacyPage } from './pages/PrivacyPage';
import { RankingPage } from './pages/RankingPage';
import { StimulusPage } from './pages/StimulusPage';
import { useAppStore } from './store';
import './styles/global.css';

const SessionPage = lazy(() =>
  import('./pages/SessionPage').then((m) => ({ default: m.SessionPage })),
);
const ResultPage = lazy(() =>
  import('./pages/ResultPage').then((m) => ({ default: m.ResultPage })),
);
const PridePage = lazy(() =>
  import('./pages/PridePage').then((m) => ({ default: m.PridePage })),
);

function LazyFallback() {
  return <div className="hydrate-wait">불러오는 중…</div>;
}

export default function App() {
  const hydrate = useAppStore((s) => s.hydrate);
  const hydrated = useAppStore((s) => s.hydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return <div className="hydrate-wait">오스완</div>;
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}>
      <InAppBrowserGate>
        <OnboardingGate>
          <Suspense fallback={<LazyFallback />}>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<HomePage />} />
                <Route path="history" element={<HistoryPage />} />
                <Route path="ranking" element={<RankingPage />} />
                <Route path="challenges" element={<ChallengesPage />} />
                <Route path="me" element={<MePage />} />
                <Route path="stimulus" element={<StimulusPage />} />
                <Route path="privacy" element={<PrivacyPage />} />
                <Route path="session" element={<SessionPage />} />
                <Route path="result" element={<ResultPage />} />
                <Route path="pride" element={<PridePage />} />
                <Route path="c/:id" element={<ChallengePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </OnboardingGate>
      </InAppBrowserGate>
    </BrowserRouter>
  );
}
