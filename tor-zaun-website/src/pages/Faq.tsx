import { useSeo } from '../hooks/useSeo';
import { PageHeader, Section } from '../components/ui';
import { faqItems } from '../data/faq';

export function Faq() {
  useSeo({
    title: 'Häufige Fragen',
    description: 'Antworten zu Lieferung, Montage, Preisen, Zahlung und Widerruf bei A-Z Tor & Zaun.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  });

  return (
    <>
      <PageHeader title="Häufige Fragen" lead="Antworten rund um Produkte, Lieferung, Montage, Zahlung und Widerruf." />
      <Section>
        <dl className="max-w-prose space-y-3">
          {faqItems.map((f) => (
            <div key={f.q} className="card overflow-hidden">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-anthracite">
                  <dt>{f.q}</dt>
                  <span aria-hidden="true" className="text-bronze transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <dd className="border-t border-line p-5 pt-4 text-muted">{f.a}</dd>
              </details>
            </div>
          ))}
        </dl>
      </Section>
    </>
  );
}
