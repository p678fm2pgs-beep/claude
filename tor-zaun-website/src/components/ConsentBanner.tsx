import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useConsent } from '../context/ConsentContext';

// Barrierefreier Consent-Dialog: per Tastatur bedienbar, mit role="dialog",
// sichtbarem Fokus und gleichwertigen Buttons "Alle ablehnen" / "Alle akzeptieren".
export function ConsentBanner() {
  const { bannerOpen, consent, acceptAll, rejectAll, saveChoice } = useConsent();
  const [statistics, setStatistics] = useState(consent.statistics);
  const [marketing, setMarketing] = useState(consent.marketing);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (bannerOpen) {
      setStatistics(consent.statistics);
      setMarketing(consent.marketing);
      headingRef.current?.focus();
    }
  }, [bannerOpen, consent.statistics, consent.marketing]);

  if (!bannerOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-heading"
      aria-describedby="consent-desc"
    >
      <div className="card w-full max-w-2xl p-6">
        <h2 id="consent-heading" tabIndex={-1} className="text-2xl">
          Datenschutz-Einstellungen
        </h2>
        <p id="consent-desc" className="mt-2 text-sm leading-relaxed text-muted">
          Wir verwenden Cookies und ähnliche Technologien. Technisch notwendige Dienste sind für den Betrieb
          erforderlich. Für alles Weitere bitten wir um Ihre Einwilligung – freiwillig, jederzeit widerrufbar.
          Details in unserer{' '}
          <Link to="/datenschutz" className="link-text">
            Datenschutzerklärung
          </Link>
          .
        </p>

        <fieldset className="mt-4 space-y-3">
          <legend className="sr-only">Cookie-Kategorien</legend>

          <label className="flex items-start gap-3 rounded-lg border border-line p-3">
            <input type="checkbox" checked readOnly disabled className="mt-1 h-5 w-5" aria-describedby="cat-nec" />
            <span>
              <span className="font-semibold">Technisch notwendig</span> (immer aktiv)
              <span id="cat-nec" className="block text-sm text-muted">
                Warenkorb, Sicherheit, Speicherung Ihrer Auswahl. Keine Einwilligung nötig.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-line p-3">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5"
              checked={statistics}
              onChange={(e) => setStatistics(e.target.checked)}
              aria-describedby="cat-stat"
            />
            <span>
              <span className="font-semibold">Statistik</span>
              <span id="cat-stat" className="block text-sm text-muted">
                Anonyme Reichweitenmessung, um die Seite zu verbessern. Wird erst nach Einwilligung geladen.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-line p-3">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              aria-describedby="cat-mkt"
            />
            <span>
              <span className="font-semibold">Marketing</span>
              <span id="cat-mkt" className="block text-sm text-muted">
                Personalisierte Inhalte und Anzeigen externer Dienste. Wird erst nach Einwilligung geladen.
              </span>
            </span>
          </label>
        </fieldset>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          {/* "Ablehnen" gleichwertig zu "Akzeptieren": gleiche Größe, gleiche Sichtbarkeit */}
          <button type="button" className="btn-primary flex-1" onClick={acceptAll}>
            Alle akzeptieren
          </button>
          <button type="button" className="btn-primary flex-1" onClick={rejectAll}>
            Alle ablehnen
          </button>
          <button
            type="button"
            className="btn-outline flex-1"
            onClick={() => saveChoice({ statistics, marketing })}
          >
            Auswahl speichern
          </button>
        </div>
      </div>
    </div>
  );
}
