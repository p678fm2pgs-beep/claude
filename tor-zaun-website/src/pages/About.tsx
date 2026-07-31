import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import { PageHeader, Section } from '../components/ui';
import { ProductImage } from '../components/ProductImage';
import { company } from '../data/company';

const values = [
  { t: 'Fachwissen', d: 'Langjährige Erfahrung im Bau von Metallzäunen und Toranlagen in NRW.' },
  { t: 'Qualität', d: 'Feuerverzinkte, pulverbeschichtete Anlagen, die jahrzehntelang halten.' },
  { t: 'Rundum-Service', d: 'Von der Beratung über das Aufmaß bis zur fachgerechten Montage – alles aus einer Hand.' },
  { t: 'Regional verwurzelt', d: `Persönlich erreichbar in ${company.city} und im gesamten Ruhrgebiet.` },
];

export function About() {
  useSeo({
    title: 'Über uns',
    description:
      'A-Z Tor & Zaun GmbH aus Hattingen – Ihr erfahrener Fachbetrieb für Zäune und Tore aus Metall im Ruhrgebiet und in ganz NRW.',
  });

  return (
    <>
      <PageHeader
        title="Über uns"
        lead={`A-Z Tor & Zaun GmbH ist Ihr erfahrener und kompetenter Partner für Zäune und Tore aus Metall – mit Sitz in ${company.city}.`}
      />

      <Section labelledBy="story-h">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="prose-page">
            <h2 id="story-h">Wer wir sind</h2>
            <p>
              Wir planen Ihren Zaun und Ihre Toranlage und setzen das Projekt mit Sorgfalt und Fachwissen direkt
              bei Ihnen vor Ort um. Ob dekorativer Zierzaun, robuster Doppelstabmattenzaun, Lärmschutz oder ein
              elektrisch betriebenes Schiebetor – wir finden die passende Lösung für private und gewerbliche
              Grundstücke.
            </p>
            <p>
              Unsere Anlagen erhalten Sie als komplettes System oder als einzelne Elemente. Auf Wunsch übernehmen
              wir die fachgerechte Montage. Schiebetore liefern wir mit einem bewährten, leichtgängigen
              Antriebskonzept – wahlweise manuell oder elektrisch.
            </p>
            <p>
              A-Z Tor &amp; Zaun hat bereits zahlreiche Zaun- und Toranlagen in {company.serviceArea.slice(0, 5).join(', ')}{' '}
              und vielen weiteren Orten in Nordrhein-Westfalen errichtet.
            </p>
            <p className="text-sm text-muted">
              [PLATZHALTER: Gründungsjahr, Teamgröße, Firmengeschichte und ein Foto des Teams/Standorts ergänzen –
              das schafft Vertrauen.]
            </p>
          </div>
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl2 border border-line">
              <ProductImage alt="Standort und Werkstatt von A-Z Tor & Zaun (Platzhalter)" variant="tor" swatch="#2d353a" className="h-56 w-full" />
            </div>
            <div className="overflow-hidden rounded-xl2 border border-line">
              <ProductImage alt="" decorative variant="zaun" swatch="#3a444a" className="h-40 w-full" />
            </div>
          </div>
        </div>
      </Section>

      <section className="bg-surface" aria-labelledby="values-h">
        <div className="container-x py-12 sm:py-16">
          <h2 id="values-h" className="mb-8 text-3xl">
            Wofür wir stehen
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <li key={v.t} className="card p-6">
                <h3 className="text-lg">{v.t}</h3>
                <p className="mt-2 text-sm text-muted">{v.d}</p>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <Link to="/kontakt" className="btn-primary">
              Lernen Sie uns kennen
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
