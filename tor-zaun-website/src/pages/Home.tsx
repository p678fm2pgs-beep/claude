import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import { Section } from '../components/ui';
import { ProductImage } from '../components/ProductImage';
import { categories, products, formatEuro } from '../data/products';
import { company, fullAddress } from '../data/company';

export function Home() {
  useSeo({
    title: 'Zäune & Tore aus Metall in Hattingen',
    description:
      'A-Z Tor & Zaun GmbH: Doppelstabmattenzaun, Schiebetore und Drehtore aus Metall. Beratung, Lieferung und Montage im Ruhrgebiet und ganz NRW.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: company.name,
      image: `${company.website}/favicon.svg`,
      telephone: company.phone,
      url: company.website,
      address: {
        '@type': 'PostalAddress',
        streetAddress: company.street,
        postalCode: company.zip,
        addressLocality: company.city,
        addressRegion: 'NRW',
        addressCountry: 'DE',
      },
      areaServed: company.serviceArea,
    },
  });

  const highlights = products.slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line bg-surface" aria-labelledby="hero-h">
        <div className="container-x grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-2">
          <div>
            <p className="mb-3 inline-block rounded-full bg-line px-3 py-1 text-sm font-semibold text-anthracite">
              Fachbetrieb aus Hattingen · NRW
            </p>
            <h1 id="hero-h" className="text-4xl leading-tight sm:text-5xl">
              Zäune und Tore aus Metall – geplant, geliefert, montiert.
            </h1>
            <p className="mt-4 max-w-prose text-lg text-muted">
              Vom Doppelstabmattenzaun bis zum elektrischen Schiebetor: Wir sichern Ihr Grundstück mit
              langlebigen Metallanlagen – als Komplettsystem oder Einzelelement, auf Wunsch inklusive
              fachgerechter Montage vor Ort.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/shop" className="btn-primary">
                Zum Shop
              </Link>
              <Link to="/kontakt" className="btn-outline">
                Kostenloses Aufmaß anfragen
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              <li>✓ Beratung, Lieferung &amp; Montage</li>
              <li>✓ Feuerverzinkt &amp; pulverbeschichtet</li>
              <li>✓ Regional im Ruhrgebiet</li>
            </ul>
          </div>
          <div className="overflow-hidden rounded-xl2 border border-line">
            <ProductImage
              alt="Anthrazitfarbene Zaun- und Toranlage aus Metall vor einem Wohnhaus"
              variant="tor"
              swatch="#2d353a"
              className="h-72 w-full sm:h-96"
            />
          </div>
        </div>
      </section>

      {/* Leistungs-/Produkt-Highlights */}
      <Section labelledBy="cat-h">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 id="cat-h" className="text-3xl">
            Unsere Bereiche
          </h2>
          <Link to="/produkte" className="link-text hidden sm:inline">
            Alle Produkte ansehen
          </Link>
        </div>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <li key={c.id} className="card overflow-hidden">
              <ProductImage
                alt=""
                decorative
                variant={c.id === 'sichtschutz' ? 'sicht' : c.id === 'doppelstabmattenzaun' ? 'zaun' : 'tor'}
                swatch="#3a444a"
                className="h-40 w-full"
              />
              <div className="p-5">
                <h3 className="text-xl">{c.label}</h3>
                <p className="mt-2 text-sm text-muted">{c.description}</p>
                <Link to={`/shop?kategorie=${c.id}`} className="link-text mt-3 inline-block">
                  Ansehen
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* Produkt-Highlights mit Preis */}
      <section className="bg-surface" aria-labelledby="hl-h">
        <div className="container-x py-12 sm:py-16">
          <h2 id="hl-h" className="mb-8 text-3xl">
            Beliebte Produkte
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((p) => (
              <li key={p.slug} className="card flex flex-col overflow-hidden">
                <ProductImage
                  alt={p.imageAlt}
                  variant={p.category === 'sichtschutz' ? 'sicht' : p.category === 'doppelstabmattenzaun' ? 'zaun' : 'tor'}
                  swatch={p.swatch}
                  className="h-40 w-full"
                />
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg">{p.name}</h3>
                  <p className="mt-1 flex-1 text-sm text-muted">{p.shortDescription}</p>
                  <p className="mt-3 font-semibold text-anthracite">
                    ab {formatEuro(Math.min(...p.variants.map((v) => v.priceCents)))}
                    <span className="ml-1 text-xs font-normal text-muted">inkl. MwSt.</span>
                  </p>
                  <Link to={`/produkte/${p.slug}`} className="btn-outline mt-3">
                    Details
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Social Proof */}
      <Section labelledBy="proof-h">
        <h2 id="proof-h" className="mb-8 text-3xl">
          Was Kund:innen sagen
        </h2>
        <p className="mb-6 max-w-prose text-sm text-muted">
          [PLATZHALTER: echte, belegbare Kundenstimmen einsetzen – z. B. aus Google-Bewertungen. Keine
          erfundenen Rezensionen verwenden.]
        </p>
        <ul className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <li key={i} className="card p-6">
              <p className="text-ink">
                „[BITTE AUSFÜLLEN: echtes Zitat einer realen Kundin/eines realen Kunden]"
              </p>
              <p className="mt-3 text-sm text-muted">— [Name, Ort], [Projekt]</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted">
          A-Z Tor &amp; Zaun hat zahlreiche Zaun- und Toranlagen in {company.serviceArea.slice(0, 4).join(', ')} und
          weiteren Orten in NRW errichtet.
        </p>
      </Section>

      {/* Über-uns-Teaser */}
      <section className="bg-anthracite text-white" aria-labelledby="about-h">
        <div className="container-x grid items-center gap-8 py-14 lg:grid-cols-2">
          <div>
            <h2 id="about-h" className="text-3xl text-white">
              Ihr Partner für Metallzäune im Ruhrgebiet
            </h2>
            <p className="mt-4 text-white/85">
              Mit Sitz in {company.city} planen wir Ihre Anlage, liefern sie und setzen sie mit Sorgfalt und
              Fachwissen bei Ihnen um. Wir beraten Sie umfassend, wie Sie Ihr Grundstück zuverlässig sichern.
            </p>
            <Link to="/ueber-uns" className="mt-6 inline-flex rounded-lg bg-white px-5 py-3 font-semibold text-anthracite hover:bg-bronze-400">
              Mehr über uns
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl2">
            <ProductImage alt="" decorative variant="zaun" swatch="#b88a4a" className="h-56 w-full" />
          </div>
        </div>
      </section>

      {/* Kontakt-CTA */}
      <Section labelledBy="cta-h">
        <div className="card flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
          <div>
            <h2 id="cta-h" className="text-2xl">
              Projekt im Kopf? Wir beraten Sie persönlich.
            </h2>
            <p className="mt-2 text-muted">
              {fullAddress} · Tel.{' '}
              <a className="link-text" href={`tel:${company.phone.replace(/\s/g, '')}`}>
                {company.phone}
              </a>
            </p>
          </div>
          <Link to="/kontakt" className="btn-primary">
            Kontakt aufnehmen
          </Link>
        </div>
      </Section>
    </>
  );
}
