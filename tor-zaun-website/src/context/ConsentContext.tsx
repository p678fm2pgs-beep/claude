import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

// DSGVO/TTDSG-konformes Consent-Management:
// - Nichts ist vorab angehakt (außer technisch notwendig, das keine Einwilligung braucht).
// - "Ablehnen" ist gleichwertig zu "Akzeptieren" (gleicher Klickaufwand, gleiche Gewichtung).
// - Granulare Kategorien, Einwilligung dokumentiert (Zeitstempel + Version).
// - Nicht-notwendige Dienste werden erst nach Einwilligung geladen.

export interface ConsentState {
  necessary: true; // immer aktiv, rechtlich ohne Einwilligung zulässig
  statistics: boolean;
  marketing: boolean;
}

interface StoredConsent extends ConsentState {
  decidedAt: string;
  version: number;
}

const CONSENT_VERSION = 1;
const STORAGE_KEY = 'aztz-consent';

interface ConsentContextValue {
  consent: ConsentState;
  decided: boolean;
  bannerOpen: boolean;
  openSettings: () => void;
  acceptAll: () => void;
  rejectAll: () => void;
  saveChoice: (partial: Omit<ConsentState, 'necessary'>) => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

const DEFAULT: ConsentState = { necessary: true, statistics: false, marketing: false };

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState>(DEFAULT);
  const [decided, setDecided] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredConsent;
        if (parsed.version === CONSENT_VERSION) {
          setConsent({ necessary: true, statistics: parsed.statistics, marketing: parsed.marketing });
          setDecided(true);
          return;
        }
      }
    } catch {
      /* ignore – Banner wird angezeigt */
    }
    setBannerOpen(true);
  }, []);

  function persist(next: Omit<ConsentState, 'necessary'>) {
    const record: StoredConsent = {
      necessary: true,
      statistics: next.statistics,
      marketing: next.marketing,
      decidedAt: new Date().toISOString(),
      version: CONSENT_VERSION,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    setConsent({ necessary: true, statistics: next.statistics, marketing: next.marketing });
    setDecided(true);
    setBannerOpen(false);
  }

  const value = useMemo<ConsentContextValue>(
    () => ({
      consent,
      decided,
      bannerOpen,
      openSettings: () => setBannerOpen(true),
      acceptAll: () => persist({ statistics: true, marketing: true }),
      rejectAll: () => persist({ statistics: false, marketing: false }),
      saveChoice: (partial) => persist(partial),
    }),
    [consent, decided, bannerOpen],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within ConsentProvider');
  return ctx;
}
