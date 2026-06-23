import { useEffect } from 'react';

interface SeoOptions {
  title: string;
  description?: string;
  /** JSON-LD strukturierte Daten (Schema.org). */
  jsonLd?: object | object[];
}

function setMeta(name: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setOg(property: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

const JSONLD_ID = 'page-jsonld';

/** Setzt Title, Description, OpenGraph und optionale strukturierte Daten je Seite. */
export function useSeo({ title, description, jsonLd }: SeoOptions) {
  useEffect(() => {
    const fullTitle = `${title} · A-Z Tor & Zaun GmbH`;
    document.title = fullTitle;
    setOg('og:title', fullTitle);
    setOg('og:type', 'website');
    if (description) {
      setMeta('description', description);
      setOg('og:description', description);
    }

    const prev = document.getElementById(JSONLD_ID);
    if (prev) prev.remove();
    if (jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = JSONLD_ID;
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
    return () => {
      const node = document.getElementById(JSONLD_ID);
      if (node) node.remove();
    };
  }, [title, description, jsonLd]);
}
