/**
 * HAVEN ATELIER — Farb-Browser (Erweiterung 6 · S5).
 * Sammlungs-Tabs (HAVEN / RAL Classic / NCS / Hersteller), Gruppierung, Suche
 * (Name/Code/HEX), Filter (Unterton, LRV), Favoriten, Vergleich 2–4 Töne.
 * Virtualisiertes Raster — bleibt auch bei 1000+ Tönen flüssig.
 * Rein additiv: die bestehende HAVEN-Familienansicht bleibt unverändert daneben bestehen.
 */
import { useMemo, useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { useT } from '../../hooks';
import { Badge } from '../../components/ui';
import {
  COLOR_FAMILIES,
  MANUFACTURER_COLLECTIONS,
  findTone,
  externalTone,
  ralToneId,
  ncsToneId,
  hexLrv,
  hexUndertone,
  type ColorTone,
} from '../../data/colors';
import { RAL_CLASSIC, RAL_GROUPS } from '../../data/ralClassic';
import { NCS_TONES } from '../../data/ncs';
import type { ColorRole, Untertone } from '../../types';
import { Star, X, Scale } from 'lucide-react';

const ROLES: ColorRole[] = ['wand', 'boden', 'decke', 'akzent', 'textil'];
const FAV_KEY = 'haven.favTones';

type CollectionId = 'alle' | 'haven' | 'ral' | 'ncs' | 'hersteller';

/** Ein Ton im Browser: vollwertiger ColorTone + Sammlungs-/Gruppen-Zuordnung. */
interface BrowserTone {
  tone: ColorTone;
  collection: Exclude<CollectionId, 'alle'>;
  groupId: string;
  groupLabel: string;
  /** Suchtext (kleingeschrieben): Name, Code(s), HEX. */
  haystack: string;
}

function loadFavs(): string[] {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    const v = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function saveFavs(ids: string[]) {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(ids));
  } catch {
    /* Speicher voll/gesperrt → Favoriten nur für die Sitzung */
  }
}

/** NCS-Gruppe aus dem Code ableiten (N / Y / R / B / G — grobe Farbton-Achse). */
function ncsGroup(code: string): { id: string; label: string } {
  const m = code.match(/-([NYRBG])/);
  const axis = m?.[1] ?? 'N';
  const labels: Record<string, string> = {
    N: 'Neutral (N)',
    Y: 'Gelb-Achse (Y)',
    R: 'Rot-Achse (R)',
    B: 'Blau-Achse (B)',
    G: 'Grün-Achse (G)',
  };
  return { id: `ncs-${axis}`, label: labels[axis] };
}

/** Baut die Gesamtliste aller Töne genau einmal auf (Modul-Ebene, statische Daten). */
function buildAllTones(lang: 'de' | 'en'): BrowserTone[] {
  const out: BrowserTone[] = [];
  for (const f of COLOR_FAMILIES) {
    for (const t of f.tones) {
      out.push({
        tone: t,
        collection: 'haven',
        groupId: f.id,
        groupLabel: lang === 'de' ? f.name : f.nameEn,
        haystack: `${t.name} ${t.nameEn} ${t.ral} ${t.ncs} ${t.hex}`.toLowerCase(),
      });
    }
  }
  for (const r of RAL_CLASSIC) {
    const tone = externalTone(ralToneId(r.code));
    if (!tone) continue;
    const g = RAL_GROUPS.find((x) => x.test(r.code));
    out.push({
      tone,
      collection: 'ral',
      groupId: g?.id ?? 'ral-sonst',
      groupLabel: g?.label ?? 'RAL',
      haystack: `${r.name} ${r.code} ${r.hex}`.toLowerCase(),
    });
  }
  for (const n of NCS_TONES) {
    const tone = externalTone(ncsToneId(n.code));
    if (!tone) continue;
    const g = ncsGroup(n.code);
    out.push({
      tone,
      collection: 'ncs',
      groupId: g.id,
      groupLabel: g.label,
      haystack: `${n.code} ${n.hex}`.toLowerCase(),
    });
  }
  for (const coll of MANUFACTURER_COLLECTIONS) {
    for (const c of coll.colors) {
      const tone = externalTone(c.id);
      if (!tone) continue;
      out.push({
        tone,
        collection: 'hersteller',
        groupId: coll.id,
        groupLabel: coll.manufacturer,
        haystack: `${c.name} ${c.code} ${c.hex} ${coll.manufacturer}`.toLowerCase(),
      });
    }
  }
  return out;
}

const COLS = 4;
const ROW_H = 108; // Kachelhöhe inkl. Abstand (px)
const VIEW_H = 540; // sichtbare Rasterhöhe (px)

export function ColorBrowser({
  roomId,
  onAssign,
  roles,
}: {
  roomId: string;
  onAssign: (role: ColorRole, toneId: string) => void;
  roles: Record<string, string | undefined>;
}) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const all = useMemo(() => buildAllTones(lang), [lang]);

  const [collection, setCollection] = useState<CollectionId>('alle');
  const [group, setGroup] = useState<string>('alle');
  const [query, setQuery] = useState('');
  const [undertone, setUndertone] = useState<Untertone | 'alle'>('alle');
  const [lrvBand, setLrvBand] = useState<'alle' | 'hell' | 'mittel' | 'dunkel'>('alle');
  const [favOnly, setFavOnly] = useState(false);
  const [favs, setFavs] = useState<string[]>(loadFavs);
  const [compare, setCompare] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => {
    const seen = new Map<string, string>();
    for (const b of all) {
      if (collection !== 'alle' && b.collection !== collection) continue;
      if (!seen.has(b.groupId)) seen.set(b.groupId, b.groupLabel);
    }
    return [...seen.entries()];
  }, [all, collection]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((b) => {
      if (collection !== 'alle' && b.collection !== collection) return false;
      if (group !== 'alle' && b.groupId !== group) return false;
      if (favOnly && !favs.includes(b.tone.id)) return false;
      if (undertone !== 'alle' && b.tone.undertone !== undertone) return false;
      if (lrvBand !== 'alle') {
        const l = b.tone.lrv;
        if (lrvBand === 'hell' && l < 60) return false;
        if (lrvBand === 'mittel' && (l < 25 || l >= 60)) return false;
        if (lrvBand === 'dunkel' && l >= 25) return false;
      }
      if (q && !b.haystack.includes(q)) return false;
      return true;
    });
  }, [all, collection, group, query, undertone, lrvBand, favOnly, favs]);

  // ── Virtualisierung: nur sichtbare Zeilen rendern ──
  const rowCount = Math.ceil(filtered.length / COLS);
  const firstRow = Math.max(0, Math.floor(scrollTop / ROW_H) - 2);
  const lastRow = Math.min(rowCount, Math.ceil((scrollTop + VIEW_H) / ROW_H) + 2);
  const visible = filtered.slice(firstRow * COLS, lastRow * COLS);

  const toggleFav = (id: string) => {
    setFavs((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveFavs(next);
      return next;
    });
  };

  const toggleCompare = (id: string) =>
    setCompare((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 4 ? prev : [...prev, id],
    );

  const selectedTone = selected ? findTone(selected) : undefined;

  const collections: { id: CollectionId; label: string }[] = [
    { id: 'alle', label: t('colors.collection.alle') },
    { id: 'haven', label: 'HAVEN' },
    { id: 'ral', label: 'RAL Classic' },
    { id: 'ncs', label: 'NCS' },
    { id: 'hersteller', label: t('colors.collection.hersteller') },
  ];

  return (
    <div data-testid="color-browser">
      {/* Sammlungs-Tabs */}
      <div className="flex flex-wrap gap-2 mb-4" data-testid="collection-tabs">
        {collections.map((c) => (
          <button
            key={c.id}
            className={`px-3 py-1.5 text-sm border rounded ${collection === c.id ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
            onClick={() => {
              setCollection(c.id);
              setGroup('alle');
            }}
            data-testid={`collection-${c.id}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Suche & Filter */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          className="field-input w-56"
          placeholder={t('colors.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          data-testid="color-search"
        />
        <select className="field-input text-xs w-44" value={group} onChange={(e) => setGroup(e.target.value)} data-testid="color-group">
          <option value="alle">{t('colors.allGroups')}</option>
          {groups.map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
        <select
          className="field-input text-xs w-32"
          value={undertone}
          onChange={(e) => setUndertone(e.target.value as Untertone | 'alle')}
          data-testid="color-undertone"
        >
          <option value="alle">{t('colors.undertone')}: {t('colors.collection.alle')}</option>
          <option value="warm">{t('undertone.warm')}</option>
          <option value="kuehl">{t('undertone.kuehl')}</option>
          <option value="neutral">{t('undertone.neutral')}</option>
        </select>
        <select
          className="field-input text-xs w-36"
          value={lrvBand}
          onChange={(e) => setLrvBand(e.target.value as typeof lrvBand)}
          data-testid="color-lrv"
        >
          <option value="alle">LRV: {t('colors.collection.alle')}</option>
          <option value="hell">{t('colors.lrvHell')}</option>
          <option value="mittel">{t('colors.lrvMittel')}</option>
          <option value="dunkel">{t('colors.lrvDunkel')}</option>
        </select>
        <button
          className={`px-3 py-1.5 text-xs border rounded inline-flex items-center gap-1.5 ${favOnly ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
          onClick={() => setFavOnly((v) => !v)}
          data-testid="color-fav-only"
        >
          <Star size={12} /> {t('colors.favOnly')}
        </button>
        <span className="text-muted text-xs ml-auto" data-testid="color-count">
          {t('colors.results', { n: filtered.length })}
        </span>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Virtualisiertes Ton-Raster */}
        <div
          ref={scrollRef}
          className="board-surface rounded p-3 overflow-y-auto"
          style={{ height: VIEW_H }}
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
          data-testid="browser-grid"
        >
          {filtered.length === 0 ? (
            <p className="text-[#6b6256] text-sm p-3">{t('colors.noResults')}</p>
          ) : (
            <div style={{ height: rowCount * ROW_H, position: 'relative' }}>
              <div
                className="grid grid-cols-4 gap-2"
                style={{ position: 'absolute', top: firstRow * ROW_H, left: 0, right: 0 }}
              >
                {visible.map((b) => (
                  <button
                    key={b.tone.id}
                    className={`text-left rounded overflow-hidden border bg-white ${selected === b.tone.id ? 'ring-2 ring-[#C9A84C]' : 'border-black/10'}`}
                    style={{ height: ROW_H - 8 }}
                    onClick={() => setSelected(b.tone.id)}
                    data-testid={`btone-${b.tone.id}`}
                  >
                    <div className="h-12" style={{ background: b.tone.hex }} />
                    <div className="px-2 py-1">
                      <p className="text-[#1A1814] text-[11px] font-medium truncate">{b.tone.name}</p>
                      <p className="text-[#6b6256] text-[10px] truncate">
                        {b.collection === 'ncs' ? b.tone.ncs : b.tone.ral} · LRV {b.tone.lrv}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Detail + Vergleich */}
        <div className="space-y-4">
          {selectedTone ? (
            <div className="card overflow-hidden" data-testid="browser-detail">
              <div className="h-20" style={{ background: selectedTone.hex }} />
              <div className="p-4">
                <p className="text-base font-medium">{selectedTone.name}</p>
                <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-muted">
                  <span>{selectedTone.ral}</span>
                  <span>·</span>
                  <span>{selectedTone.ncs}</span>
                  <span>·</span>
                  <span>{t('colors.lrv')} {selectedTone.lrv}</span>
                  <span>·</span>
                  <Badge tone="muted">{t(`undertone.${selectedTone.undertone}`)}</Badge>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    className={`px-2.5 py-1 text-xs border rounded inline-flex items-center gap-1 ${favs.includes(selectedTone.id) ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
                    onClick={() => toggleFav(selectedTone.id)}
                    data-testid="browser-fav"
                  >
                    <Star size={12} /> {t('colors.favorite')}
                  </button>
                  <button
                    className={`px-2.5 py-1 text-xs border rounded inline-flex items-center gap-1 ${compare.includes(selectedTone.id) ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
                    onClick={() => toggleCompare(selectedTone.id)}
                    data-testid="browser-compare-add"
                  >
                    <Scale size={12} /> {t('colors.compareAdd')}
                  </button>
                </div>
                <div className="mt-3">
                  <p className="field-label">{t('colors.assignRole')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ROLES.map((role) => (
                      <button
                        key={role}
                        className={`px-2.5 py-1 text-xs border rounded ${roles[role] === selectedTone.id ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
                        onClick={() => onAssign(role, selectedTone.id)}
                        data-testid={`browser-assign-${role}`}
                      >
                        {t(`colors.role.${role}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-5 text-muted text-sm">{t('colors.browserHint')}</div>
          )}

          {/* Vergleich 2–4 */}
          <div className="card p-4" data-testid="compare-panel">
            <div className="flex items-center justify-between mb-2">
              <p className="eyebrow">{t('colors.compare')}</p>
              {compare.length > 0 && (
                <button className="text-muted text-xs hover:text-text" onClick={() => setCompare([])} data-testid="compare-clear">
                  {t('colors.compareClear')}
                </button>
              )}
            </div>
            {compare.length < 2 ? (
              <p className="text-muted text-xs">{t('colors.compareHint')}</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {compare.map((id) => {
                  const tone = findTone(id);
                  if (!tone) return null;
                  return (
                    <div key={id} className="rounded overflow-hidden border border-line" data-testid={`compare-${id}`}>
                      <div className="h-14 relative" style={{ background: tone.hex }}>
                        <button
                          className="absolute top-1 right-1 bg-black/40 text-white rounded-full p-0.5"
                          onClick={() => toggleCompare(id)}
                          aria-label={t('common.delete')}
                        >
                          <X size={10} />
                        </button>
                      </div>
                      <div className="p-1.5">
                        <p className="text-[11px] font-medium truncate">{tone.name}</p>
                        <p className="text-muted text-[10px]">LRV {tone.lrv} · {t(`undertone.${tone.undertone}`)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-muted text-[11px]" data-testid="browser-honesty">
            {t('colors.honesty')}
          </p>
        </div>
      </div>
      <span className="sr-only">{roomId}</span>
    </div>
  );
}

/* Interne Helfer bewusst re-exportiert für Tests. */
export const __test = { ncsGroup, buildAllTones, hexLrv, hexUndertone };
