import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { useT } from './hooks';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SetupScreen } from './modules/auth/SetupScreen';
import { GateScreen } from './modules/auth/GateScreen';
import { Workspace } from './modules/Workspace';

export function App() {
  const { ready, hasSetup, unlocked, init } = useStore();
  const toast = useStore((s) => s.toast);
  const showToast = useStore((s) => s.showToast);
  const t = useT();

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => showToast(null), 4000);
      return () => clearTimeout(id);
    }
  }, [toast, showToast]);

  if (!ready) {
    return (
      <div className="h-full flex items-center justify-center" data-testid="splash">
        <div className="text-center">
          <p className="eyebrow mb-2">{t('app.tagline')}</p>
          <h1 className="text-5xl">{t('app.title')}</h1>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {!hasSetup ? <SetupScreen /> : !unlocked ? <GateScreen /> : <Workspace />}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 card border-danger/40 px-5 py-3 text-sm z-50"
          role="status"
        >
          {t(toast)}
        </div>
      )}
    </ErrorBoundary>
  );
}
