// Zentrale Firmendaten. Verifizierte Angaben stammen aus öffentlichen Verzeichnissen
// (Handelsregister-Eintrag, Branchenbücher). Rechtlich relevante Lücken sind bewusst
// als [BITTE AUSFÜLLEN] markiert und NICHT erfunden – siehe Impressum-Seite.

export const company = {
  name: 'A-Z Tor & Zaun GmbH',
  shortName: 'A-Z Tor & Zaun',
  legalForm: 'GmbH',
  claim: 'Zäune und Tore aus Metall – geplant, geliefert, montiert.',
  // Verifiziert (öffentliche Verzeichnisse)
  street: 'Am Beul 33',
  zip: '45525',
  city: 'Hattingen',
  region: 'Nordrhein-Westfalen',
  country: 'Deutschland',
  phone: '02324 6857200',
  phoneSecondary: '02324 68572010',
  phoneE164: '+49232468572 00',
  website: 'https://www.tor-und-zaun.de',
  registerNumber: 'HRB 16992',

  // NICHT verifiziert – dürfen rechtlich nicht erfunden werden:
  email: '[BITTE AUSFÜLLEN: offizielle Kontakt-E-Mail, z. B. info@tor-und-zaun.de]',
  managingDirector: '[BITTE AUSFÜLLEN: Name des/der Geschäftsführer:in]',
  registerCourt: '[BITTE AUSFÜLLEN: zuständiges Amtsgericht, z. B. Amtsgericht Essen]',
  vatId: '[BITTE AUSFÜLLEN: USt-IdNr. gem. § 27a UStG, z. B. DE000000000]',
  responsibleForContent:
    '[BITTE AUSFÜLLEN: inhaltlich Verantwortliche:r i. S. d. § 18 Abs. 2 MStV]',

  // Einzugsgebiet / Referenzorte (verifiziert aus öffentlicher Darstellung)
  serviceArea: ['Hattingen', 'Witten', 'Velbert', 'Essen', 'Bochum', 'gesamtes Ruhrgebiet & NRW'],

  // Für die BFSG-Kleinstunternehmer-Prüfung erforderlich (siehe Barrierefreiheitserklärung)
  employees: '[BITTE AUSFÜLLEN: Anzahl Beschäftigte – relevant für BFSG-Ausnahme < 10]',
  annualTurnover: '[BITTE AUSFÜLLEN: Jahresumsatz/Bilanzsumme – relevant für BFSG-Ausnahme ≤ 2 Mio. €]',

  // Öffnungszeiten – Beispielwerte als Platzhalter, vor Livegang prüfen
  openingHours: [
    { days: 'Mo–Do', time: '[BITTE AUSFÜLLEN: z. B. 08:00–17:00]' },
    { days: 'Fr', time: '[BITTE AUSFÜLLEN: z. B. 08:00–15:00]' },
    { days: 'Sa–So', time: 'geschlossen' },
  ],

  social: {
    // Nur eintragen, was tatsächlich existiert:
    facebook: '[BITTE AUSFÜLLEN oder entfernen]',
    instagram: '[BITTE AUSFÜLLEN oder entfernen]',
  },
} as const;

export const fullAddress = `${company.street}, ${company.zip} ${company.city}`;
