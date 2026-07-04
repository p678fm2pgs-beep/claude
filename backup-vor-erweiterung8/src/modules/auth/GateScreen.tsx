import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useT } from '../../hooks';
import { Eyebrow } from '../../components/ui';

export function GateScreen() {
  const t = useT();
  const login = useStore((s) => s.login);
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const [pw, setPw] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const ok = await login(pw);
    setBusy(false);
    if (!ok) {
      setError(true);
      setPw('');
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <form className="w-full max-w-sm" onSubmit={submit}>
        <div className="text-center mb-8">
          <Eyebrow>{t('app.tagline')}</Eyebrow>
          <h1 className="text-5xl mt-2">{t('app.title')}</h1>
          <p className="text-muted text-sm mt-2">{t('app.subtitle')}</p>
        </div>

        <label className="block mb-4">
          <span className="field-label">{t('gate.password')}</span>
          <input
            type="password"
            className="field-input text-center text-lg"
            value={pw}
            onChange={(e) => {
              setPw(e.target.value);
              setError(false);
            }}
            autoFocus
            data-testid="gate-password"
          />
          {error && (
            <span className="field-error block text-center mt-2" role="alert">
              {t('gate.wrong')}
            </span>
          )}
        </label>

        <button className="btn btn-primary w-full" type="submit" disabled={busy} data-testid="gate-enter">
          {t('gate.enter')}
        </button>

        <p className="text-muted text-xs text-center mt-6">{t('gate.note')}</p>

        <div className="flex items-center justify-center gap-3 mt-6">
          {(['de', 'en'] as const).map((l) => (
            <button
              key={l}
              type="button"
              className={`text-xs uppercase tracking-wider ${lang === l ? 'text-gold' : 'text-muted'}`}
              onClick={() => setLang(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
