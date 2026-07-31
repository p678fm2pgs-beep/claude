import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

export function PageHeader({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="border-b border-line bg-surface">
      <div className="container-x py-10 sm:py-14">
        <h1 className="text-3xl sm:text-4xl">{title}</h1>
        {lead && <p className="mt-3 max-w-prose text-lg text-muted">{lead}</p>}
      </div>
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Brotkrümel" className="container-x py-4 text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {item.to ? (
              <Link to={item.to} className="link-text">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {item.label}
              </span>
            )}
            {i < items.length - 1 && <span aria-hidden="true">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Section({
  children,
  className = '',
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  return (
    <section aria-labelledby={labelledBy} className={`container-x py-12 sm:py-16 ${className}`}>
      {children}
    </section>
  );
}

/** PAngV-konformer Preishinweis. */
export function VatNote({ withBase }: { withBase?: boolean }) {
  return (
    <span className="text-sm text-muted">
      inkl. MwSt., zzgl.{' '}
      <Link to="/versand-zahlung" className="link-text">
        Versand
      </Link>
      {withBase ? ' · Grundpreis siehe Produkt' : ''}
    </span>
  );
}
