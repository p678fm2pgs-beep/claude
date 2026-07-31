import { Link } from 'react-router-dom';
import { useSeo } from '../../hooks/useSeo';
import { PageHeader, Section } from '../../components/ui';
import { LegalNote } from './LegalNote';
import { company, fullAddress } from '../../data/company';

export function Widerruf() {
  useSeo({ title: 'Widerrufsbelehrung', description: 'Widerrufsrecht und Muster-Widerrufsformular für Verbraucher.' });
  return (
    <>
      <PageHeader title="Widerrufsbelehrung" />
      <Section>
        <div className="prose-page">
          <LegalNote />

          <h2>Widerrufsrecht</h2>
          <p>
            Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die
            Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der
            nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat.
          </p>
          <p>
            Um Ihr Widerrufsrecht auszuüben, müssen Sie uns ({company.name}, {fullAddress}, Telefon {company.phone},
            E-Mail {company.email}) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder
            E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte
            Muster-Widerrufsformular oder unsere{' '}
            <Link to="/widerruf-button">elektronische Widerrufsfunktion</Link> verwenden, was jedoch nicht
            vorgeschrieben ist.
          </p>
          <p>
            Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des
            Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
          </p>

          <h2>Folgen des Widerrufs</h2>
          <p>
            Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben,
            einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie
            eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben),
            unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über
            Ihren Widerruf dieses Vertrags bei uns eingegangen ist.
          </p>

          <h2>Ausschluss / Erlöschen des Widerrufsrechts</h2>
          <p>
            Das Widerrufsrecht besteht nicht bzw. erlischt bei Verträgen zur Lieferung von Waren, die nicht
            vorgefertigt sind und für deren Herstellung eine individuelle Auswahl oder Bestimmung durch den
            Verbraucher maßgeblich ist oder die eindeutig auf die persönlichen Bedürfnisse zugeschnitten sind (z. B.
            nach Maß gefertigte Zaun-/Toranlagen). [BITTE AUSFÜLLEN/anwaltlich prüfen, soweit zutreffend.]
          </p>

          <h2>Muster-Widerrufsformular</h2>
          <p className="text-sm text-muted">
            (Wenn Sie den Vertrag widerrufen wollen, füllen Sie bitte dieses Formular aus und senden Sie es zurück.)
          </p>
          <div className="not-prose rounded-lg border border-line bg-surface p-5 text-sm leading-relaxed">
            <p>An: {company.name}, {fullAddress}, E-Mail: {company.email}</p>
            <p className="mt-3">
              Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der
              folgenden Waren (*):
            </p>
            <p className="mt-3">__________________________________________________</p>
            <p className="mt-3">Bestellt am (*) / erhalten am (*): ____________________</p>
            <p>Name des/der Verbraucher(s): ____________________</p>
            <p>Anschrift des/der Verbraucher(s): ____________________</p>
            <p>Unterschrift (nur bei Mitteilung auf Papier): ____________________</p>
            <p>Datum: ____________________</p>
            <p className="mt-3 text-muted">(*) Unzutreffendes streichen.</p>
          </div>

          <p className="mt-6">
            <Link to="/widerruf-button" className="btn-accent">
              Jetzt elektronisch widerrufen
            </Link>
          </p>
        </div>
      </Section>
    </>
  );
}
