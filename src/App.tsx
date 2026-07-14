import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { InAppBrowserGate } from './components/InAppBrowserGate';
import { OnboardingGate } from './components/OnboardingGate';
import { ChallengePage } from './pages/ChallengePage';
import { ChallengesPage } from './pages/ChallengesPage';
import { HistoryPage } from './pages/HistoryPage';
import { HomePage } from './pages/HomePage';
import { MePage } from './pages/MePage';
import { PridePage } from './pages/PridePage';
import { RankingPage } from './pages/RankingPage';
import { ResultPage } from './pages/ResultPage';
import { SessionPage } from './pages/SessionPage';
import { useAppStore } from './store';
import './styles/global.css';

export default function App() {
  const hydrate = useAppStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}>
      <OnboardingGate>
        <InAppBrowserGate>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="ranking" element={<RankingPage />} />
              <Route path="challenges" element={<ChallengesPage />} />
              <Route path="me" element={<MePage />} />
              <Route path="session" element={<SessionPage />} />
              <Route path="result" element={<ResultPage />} />
              <Route path="pride" element={<PridePage />} />
              <Route path="c/:id" element={<ChallengePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </InAppBrowserGate>
      </OnboardingGate>
    </BrowserRouter>
  );
}
