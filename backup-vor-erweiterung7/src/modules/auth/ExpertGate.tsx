import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useT } from '../../hooks';
import { Eyebrow } from '../../components/ui';
import { X } from 'lucide-react';

export function ExpertGate({ onClose }: { onClose: () => void }) {
  const t = useT();
  const unlockExpert = useStore((s) => s.unlockExpert);
  const [pw, setPw] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const ok = await unlockExpert(pw);
    setBusy(false);
    if (ok) onClose();
    else {
      setError(true);
      setPw('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6" onClick={onClose}>
      <form
        className="card p-8 w-full max-w-sm relative"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <button type="button" className="absolute top-4 right-4 text-muted hover:text-gold" onClick={onClose}>
          <X size={18} />
        </button>
        <Eyebrow>{t('gate.eyebrow')}</Eyebrow>
        <h3 className="text-2xl mt-1 mb-4">{t('gate.expertTitle')}</h3>
        <p className="text-muted text-sm mb-4">{t('gate.expertPrompt')}</p>
        <input
          type="password"
          className="field-input text-center"
          value={pw}
          onChange={(e) => {
            setPw(e.target.value);
            setError(false);
          }}
          autoFocus
          data-testid="expert-password"
        />
        {error && (
          <span className="field-error block text-center mt-2" role="alert">
            {t('gate.wrong')}
          </span>
        )}
        <button className="btn btn-primary w-full mt-5" type="submit" disabled={busy} data-testid="expert-unlock">
          {t('gate.unlock')}
        </button>
      </form>
    </div>
  );
}
