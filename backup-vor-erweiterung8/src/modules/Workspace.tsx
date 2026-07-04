import { useState } from 'react';
import { useStore } from '../store/useStore';
import { useT } from '../hooks';
import { ProjectList } from './project/ProjectList';
import { Planner } from './Planner';
import { PresentationMode } from './board/PresentationMode';
import { ExpertGate } from './auth/ExpertGate';
import type { AppMode } from '../types';

export function Workspace() {
  const t = useT();
  const project = useStore((s) => s.project);
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const expertUnlocked = useStore((s) => s.expertUnlocked);
  const presenting = useStore((s) => s.presenting);
  const setPresenting = useStore((s) => s.setPresenting);
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const logout = useStore((s) => s.logout);
  const saveState = useStore((s) => s.saveState);
  const [showExpertGate, setShowExpertGate] = useState(false);

  const requestMode = (m: AppMode) => {
    if (m === 'experte' && !expertUnlocked) {
      setShowExpertGate(true);
      return;
    }
    if (m === 'praesentation') {
      if (project) setPresenting(true);
      return;
    }
    setMode(m);
  };

  if (presenting && project) {
    return <PresentationMode />;
  }

  const modes: AppMode[] = ['beratung', 'experte', 'praesentation'];

  return (
    <div className="min-h-full flex flex-col">
      <header className="flex items-center justify-between px-6 py-3 border-b border-line">
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-xl text-gold">{t('app.title')}</span>
          <span className="eyebrow hidden sm:block">{t('app.tagline')}</span>
        </div>

        <nav className="flex items-center gap-1" aria-label="Modus">
          {modes.map((m) => (
            <button
              key={m}
              className={`tab ${mode === m && m !== 'praesentation' ? 'tab-active' : ''}`}
              onClick={() => requestMode(m)}
              data-testid={`mode-${m}`}
            >
              {t(`mode.${m}`)}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {project && (
            <span className="text-xs text-muted" data-testid="save-state">
              {saveState === 'saving' ? t('common.saving') : saveState === 'saved' ? t('common.saved') : ''}
            </span>
          )}
          <div className="flex items-center gap-2">
            {(['de', 'en'] as const).map((l) => (
              <button
                key={l}
                className={`text-xs uppercase ${lang === l ? 'text-gold' : 'text-muted'}`}
                onClick={() => setLang(l)}
                data-testid={`lang-${l}`}
              >
                {l}
              </button>
            ))}
          </div>
          <button className="text-xs text-muted hover:text-gold uppercase tracking-wider" onClick={logout}>
            {t('nav.logout')}
          </button>
        </div>
      </header>

      <main className="flex-1">{project ? <Planner /> : <ProjectList />}</main>

      {showExpertGate && <ExpertGate onClose={() => setShowExpertGate(false)} />}
    </div>
  );
}
