import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';

export function NotFound() {
  useSeo({ title: 'Seite nicht gefunden', description: 'Die angeforderte Seite existiert nicht.' });
  return (
    <div className="container-x py-20 text-center">
      <p className="font-serif text-6xl text-anthracite">404</p>
      <h1 className="mt-4 text-2xl">Seite nicht gefunden</h1>
      <p className="mt-2 text-muted">Die angeforderte Seite existiert nicht oder wurde verschoben.</p>
      <Link to="/" className="btn-primary mt-6">
        Zur Startseite
      </Link>
    </div>
  );
}
