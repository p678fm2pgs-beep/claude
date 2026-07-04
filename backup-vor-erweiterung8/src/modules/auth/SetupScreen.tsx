import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useT } from '../../hooks';
import { generateTwoPassphrases } from '../../lib/password';
import { Eyebrow } from '../../components/ui';
import { Copy, Check, RefreshCw, Download } from 'lucide-react';

export function SetupScreen() {
  const t = useT();
  const completeSetup = useStore((s) => s.completeSetup);
  const [pws, setPws] = useState(() => generateTwoPassphrases());
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* clipboard evtl. nicht verfügbar — Wert bleibt sichtbar */
    }
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const exportTxt = () => {
    const content = `HAVEN ATELIER — Passwörter\n\nSTART-PASSWORT: ${pws.start}\nEXPERTEN-PASSWORT: ${pws.expert}\n\nBitte sicher verwahren.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'HAVEN_Passwoerter.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const proceed = async () => {
    if (!confirmed || busy) return;
    setBusy(true);
    await completeSetup(pws.start, pws.expert);
  };

  const PwField = ({ label, hint, value, k }: { label: string; hint: string; value: string; k: string }) => (
    <div className="card p-5">
      <Eyebrow>{label}</Eyebrow>
      <p className="text-muted text-xs mb-3">{hint}</p>
      <div className="flex items-center justify-between gap-3">
        <code
          className="text-2xl font-serif text-gold tracking-wide select-all"
          data-testid={`pw-${k}`}
        >
          {value}
        </code>
        <button className="btn btn-ghost shrink-0" onClick={() => copy(k, value)} aria-label={t('setup.copy')}>
          {copied === k ? <Check size={16} /> : <Copy size={16} />}
          {copied === k ? t('setup.copied') : t('setup.copy')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Eyebrow>{t('setup.eyebrow')}</Eyebrow>
          <h1 className="text-4xl mt-2">{t('setup.title')}</h1>
          <p className="text-muted mt-3 max-w-xl mx-auto">{t('setup.intro')}</p>
        </div>

        <div className="space-y-4">
          <PwField label={t('setup.startPw')} hint={t('setup.startPwHint')} value={pws.start} k="start" />
          <PwField label={t('setup.expertPw')} hint={t('setup.expertPwHint')} value={pws.expert} k="expert" />
        </div>

        <div className="flex items-center gap-3 mt-5 flex-wrap">
          <button className="btn btn-ghost" onClick={() => setPws(generateTwoPassphrases())}>
            <RefreshCw size={15} /> {t('setup.regenerate')}
          </button>
          <button className="btn btn-ghost" onClick={exportTxt}>
            <Download size={15} /> {t('setup.exportTxt')}
          </button>
        </div>

        <div className="card border-gold/40 p-4 mt-6 bg-gold/5">
          <p className="text-sm text-gold">{t('setup.warning')}</p>
        </div>

        <label className="flex items-start gap-3 mt-5 cursor-pointer select-none">
          <input
            type="checkbox"
            className="mt-1 accent-[#C9A84C]"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            data-testid="confirm-pw"
          />
          <span className="text-sm">{t('setup.confirm')}</span>
        </label>

        <button
          className="btn btn-primary w-full mt-6 disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={!confirmed || busy}
          onClick={proceed}
          data-testid="setup-continue"
        >
          {t('setup.continue')}
        </button>
        <p className="text-muted text-xs text-center mt-3">{t('setup.recovery')}</p>
      </div>
    </div>
  );
}
