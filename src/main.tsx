import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';

/** Stale SW/chunks after rapid deploys → blank screen. Force a clean load once. */
function reloadOnceForStaleAssets(reason: string) {
  try {
    const key = 'oswan.staleAssetReload';
    if (sessionStorage.getItem(key) === '1') return;
    sessionStorage.setItem(key, '1');
    console.warn('[oswan] reloading for stale assets:', reason);
    window.location.reload();
  } catch {
    window.location.reload();
  }
}

window.addEventListener('error', (ev) => {
  const msg = String(ev.message || '');
  if (
    /Loading chunk|ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed/i.test(
      msg,
    )
  ) {
    reloadOnceForStaleAssets(msg);
  }
});

window.addEventListener('unhandledrejection', (ev) => {
  const reason = ev.reason;
  const msg = String(reason?.message || reason || '');
  if (
    /Loading chunk|ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed/i.test(
      msg,
    )
  ) {
    reloadOnceForStaleAssets(msg);
  }
});

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // autoUpdate: apply waiting SW then reload
    void updateSW(true);
  },
  onRegisteredSW(_swUrl, registration) {
    void registration?.update();
    window.setInterval(() => {
      void registration?.update();
    }, 60_000);

    if (registration) {
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            void updateSW(true);
          }
        });
      });
    }
  },
});

let refreshing = false;
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  if (refreshing) return;
  refreshing = true;
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
