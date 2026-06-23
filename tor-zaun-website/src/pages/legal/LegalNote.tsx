// Wiederverwendbarer Hinweis: kein Rechtstext ist anwaltlich geprüft.
export function LegalNote() {
  return (
    <div className="not-prose mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <strong>Wichtiger Hinweis:</strong> Dies ist ein strukturierter Entwurf, keine Rechtsberatung. Lassen Sie alle
      Rechtstexte vor dem Livegang anwaltlich oder durch einen seriösen Rechtstext-Dienst (z. B. IT-Recht-Kanzlei,
      eRecht24, Trusted Shops) prüfen und ergänzen. Mit <strong>[BITTE AUSFÜLLEN]</strong> markierte Felder enthalten
      noch keine verbindlichen Daten und dürfen nicht erfunden werden.
    </div>
  );
}
