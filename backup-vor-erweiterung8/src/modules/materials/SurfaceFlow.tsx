import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { useT } from '../../hooks';
import { Badge } from '../../components/ui';
import { TextureSwatch } from '../../components/TextureSwatch';
import { RealisticPlan } from '../../components/RealisticPlan';
import { getRoom, getActiveVariant } from '../roomHelpers';
import { MATERIALS, findMaterial, type Material } from '../../data/materials';
import { allWarnings } from '../../lib/suitability';
import { computeRoomCost } from '../../lib/projectCost';
import { fillFloorSurface } from '../../lib/texture';
import { formatEUR } from '../../lib/format';
import { uid } from '../../lib/id';
import type { Finish, LayingDirection, LayingPattern, PriceTier } from '../../types';
import { Star, Check, ChevronLeft } from 'lucide-react';

/**
 * Erweiterung 6 · S3 — Zwei-Schritt-Auswahl für Böden & Wände.
 * Schritt 1: Material wählen (Kacheln, Suche, Filter, Favoriten, zuletzt verwendet).
 * Schritt 2: Ausführung wählen (Finish, Verlegemuster mit Mini-Vorschau, Richtung, Format, Fugenfarbe).
 * Immer sichtbar: „Aktuelle Wahl"-Leiste in Klartext + Live-Vorschau + Endpreis (VK).
 */

const FINISHES: { id: Finish; de: string }[] = [
  { id: 'natur-geoelt', de: 'natur geölt' },
  { id: 'weiss-geoelt', de: 'weiß geölt' },
  { id: 'matt-lackiert', de: 'matt lackiert' },
  { id: 'seidenmatt', de: 'seidenmatt' },
  { id: 'geraeuchert', de: 'geräuchert' },
  { id: 'gebuerstet', de: 'gebürstet' },
  { id: 'gekaelkt', de: 'gekälkt' },
  { id: 'dunkel-gebeizt', de: 'dunkel gebeizt' },
  { id: 'rustikal', de: 'rustikal' },
  { id: 'handgehobelt', de: 'handgehobelt' },
  { id: 'gebeizt-grau', de: 'gebeizt grau' },
];

const PATTERNS: { id: LayingPattern; de: string }[] = [
  { id: 'landhausdiele', de: 'Landhausdiele' },
  { id: 'schiffsboden', de: 'Schiffsboden' },
  { id: 'fischgraet', de: 'Fischgräte' },
  { id: 'chevron', de: 'Chevron' },
  { id: 'wuerfel', de: 'Würfel' },
  { id: 'diagonal', de: 'Diagonal' },
];

const DIRECTIONS: { id: LayingDirection; de: string }[] = [
  { id: 'laengs', de: 'längs' },
  { id: 'quer', de: 'quer' },
  { id: 'diagonal', de: 'diagonal' },
];

const TILE_FORMATS = ['30×60', '60×60', '60×120', '80×80', '120×280'];
const GROUT_COLORS: { hex: string; de: string }[] = [
  { hex: '#B9B5AC', de: 'Silbergrau' },
  { hex: '#3A3D40', de: 'Anthrazit' },
  { hex: '#EDEAE3', de: 'Weiß' },
  { hex: '#C9BCA2', de: 'Sand' },
];

const FAV_KEY = 'haven.favMaterials';
const RECENT_KEY = 'haven.recentMaterials';

function loadIds(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as string[];
  } catch {
    return [];
  }
}
function saveIds(key: string, ids: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(ids.slice(0, 24)));
  } catch {
    /* Speicher voll o. ä. — Favoriten sind optional */
  }
}

/** Mini-Vorschau eines Verlegemusters mit der Textur des gewählten Materials. */
function PatternThumb({ material, pattern }: { material: Material; pattern: LayingPattern }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    fillFloorSurface(ctx, { minX: 0, minY: 0, maxX: c.width, maxY: c.height }, 26, {
      texture: material.texture,
      pattern,
    });
  }, [material, pattern]);
  return <canvas ref={ref} width={84} height={52} className="rounded-sm block" aria-hidden />;
}

export function SurfaceFlow({ roomId, surface }: { roomId: string; surface: 'boden' | 'wand' }) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const mode = useStore((s) => s.mode);
  const project = useStore((s) => s.project)!;
  const updateProject = useStore((s) => s.updateProject);
  const room = getRoom(project, roomId)!;
  const variant = getActiveVariant(room)!;

  const [search, setSearch] = useState('');
  const [fbhOnly, setFbhOnly] = useState(false);
  const [wetOnly, setWetOnly] = useState(false);
  const [favs, setFavs] = useState<string[]>(() => loadIds(FAV_KEY));
  const [recent, setRecent] = useState<string[]>(() => loadIds(RECENT_KEY));
  const [wallIndex, setWallIndex] = useState<number | undefined>(undefined);

  const pool = useMemo(
    () => MATERIALS.filter((m) => m.surface === surface),
    [surface],
  );

  // Aktuelle Auswahl (zuletzt gewählte für diese Fläche/Wand — Resolver-Semantik)
  const currentSel = useMemo(() => {
    let found;
    for (const s of variant.materials) {
      if (s.surface !== surface) continue;
      if (surface === 'wand' && s.wallIndex !== wallIndex) continue;
      found = s;
    }
    return found;
  }, [variant.materials, surface, wallIndex]);
  const currentMat = currentSel ? findMaterial(currentSel.materialId) : undefined;

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = pool.filter((m) => {
      if (q && !`${m.name} ${m.nameEn} ${m.subcategory} ${m.tags.join(' ')}`.toLowerCase().includes(q)) return false;
      if (fbhOnly && m.tech.fbh === 'nein') return false;
      if (wetOnly && !m.tech.nasszelle) return false;
      return true;
    });
    const bySub = new Map<string, Material[]>();
    for (const m of filtered) {
      const list = bySub.get(m.subcategory) ?? [];
      list.push(m);
      bySub.set(m.subcategory, list);
    }
    return [...bySub.entries()];
  }, [pool, search, fbhOnly, wetOnly]);

  const favMaterials = favs.map((id) => findMaterial(id)).filter((m): m is Material => !!m && m.surface === surface);
  const recentMaterials = recent
    .map((id) => findMaterial(id))
    .filter((m): m is Material => !!m && m.surface === surface)
    .slice(0, 6);

  const toggleFav = (id: string) => {
    const next = favs.includes(id) ? favs.filter((x) => x !== id) : [id, ...favs];
    setFavs(next);
    saveIds(FAV_KEY, next);
  };

  const chooseMaterial = (m: Material) => {
    const nextRecent = [m.id, ...recent.filter((x) => x !== m.id)];
    setRecent(nextRecent);
    saveIds(RECENT_KEY, nextRecent);
    updateProject((p) => {
      const r = p.rooms.find((x) => x.id === roomId);
      const v = r?.variants.find((x) => x.id === r.activeVariantId);
      if (!v) return;
      if (surface === 'boden') {
        v.materials = v.materials.filter((s) => s.surface !== 'boden');
        v.materials.push({ id: uid('ms'), materialId: m.id, surface: 'boden', tier: 'premium', pattern: 'landhausdiele' });
      } else {
        v.materials = v.materials.filter((s) => !(s.surface === 'wand' && s.wallIndex === wallIndex));
        v.materials.push({ id: uid('ms'), materialId: m.id, surface: 'wand', tier: 'premium', wallIndex });
      }
    });
  };

  const patchSel = (patch: Partial<NonNullable<typeof currentSel>>) => {
    if (!currentSel) return;
    updateProject((p) => {
      const r = p.rooms.find((x) => x.id === roomId);
      const v = r?.variants.find((x) => x.id === r.activeVariantId);
      const s = v?.materials.find((x) => x.id === currentSel.id);
      if (s) Object.assign(s, patch);
    });
  };

  const clearChoice = () => {
    if (!currentSel) return;
    updateProject((p) => {
      const r = p.rooms.find((x) => x.id === roomId);
      const v = r?.variants.find((x) => x.id === r.activeVariantId);
      if (v) v.materials = v.materials.filter((x) => x.id !== currentSel.id);
    });
  };

  // Klartext der aktuellen Wahl, z. B. „Eiche geräuchert · Fischgräte · diagonal"
  const choiceLabel = useMemo(() => {
    if (!currentMat || !currentSel) return t('flow.noChoice');
    const parts = [lang === 'de' ? currentMat.name : currentMat.nameEn];
    const fin = FINISHES.find((f) => f.id === currentSel.finish);
    if (fin) parts.push(fin.de);
    const pat = PATTERNS.find((x) => x.id === currentSel.pattern);
    if (pat) parts.push(pat.de);
    const dir = DIRECTIONS.find((x) => x.id === currentSel.layingDirection);
    if (dir) parts.push(dir.de);
    if (currentSel.format) parts.push(currentSel.format);
    return parts.join(' · ');
  }, [currentMat, currentSel, lang, t]);

  const roomCost = useMemo(() => computeRoomCost(room, project.settings.paintCoverage), [room, project.settings.paintCoverage]);

  const isWood = currentMat?.texture.variant === 'wood';
  const isTile = currentMat?.texture.variant === 'tile' || currentMat?.texture.variant === 'stone';
  const wallCount = room.floorplan.points.length;

  return (
    <div data-testid={`surface-flow-${surface}`}>
      {/* Aktuelle Wahl — immer sichtbar */}
      <div className="card border-gold/40 p-4 mb-5 flex flex-wrap items-center gap-4" data-testid="current-choice-bar">
        <div className="flex-1 min-w-[220px]">
          <p className="eyebrow mb-1">{t('flow.currentChoice')}</p>
          <p className="text-lg font-serif" data-testid="current-choice-label">{choiceLabel}</p>
          <p className="text-muted text-xs mt-1">
            {t('flow.roomPrice')}:{' '}
            <span className="text-gold" data-testid="flow-room-price">
              {roomCost.subtotal.min === roomCost.subtotal.max
                ? formatEUR(roomCost.subtotal.min, lang)
                : `${formatEUR(roomCost.subtotal.min, lang)} – ${formatEUR(roomCost.subtotal.max, lang)}`}
            </span>{' '}
            ({t('common.net')}{mode === 'experte' ? ' · VK' : ''})
          </p>
        </div>
        <div className="board-surface rounded overflow-hidden shrink-0">
          <RealisticPlan room={room} variant={variant} width={230} height={150} />
        </div>
        {currentSel && (
          <button className="btn btn-ghost text-xs" onClick={clearChoice}>
            <ChevronLeft size={13} /> {t('flow.changeMaterial')}
          </button>
        )}
      </div>

      {/* Wand-Auswahl bei Wänden */}
      {surface === 'wand' && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="field-label mb-0">{t('rooms.wall')}:</span>
          <button
            className={`px-2.5 py-1 text-xs border rounded ${wallIndex === undefined ? 'border-gold text-gold' : 'border-line text-muted'}`}
            onClick={() => setWallIndex(undefined)}
          >
            {t('flow.allWalls')}
          </button>
          {Array.from({ length: wallCount }, (_, i) => (
            <button
              key={i}
              className={`px-2.5 py-1 text-xs border rounded ${wallIndex === i ? 'border-gold text-gold' : 'border-line text-muted'}`}
              onClick={() => setWallIndex(i)}
            >
              {t('rooms.wall')} {i + 1}
            </button>
          ))}
        </div>
      )}

      {!currentSel ? (
        <>
          {/* ── SCHRITT 1: Material wählen ── */}
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-gold text-bg text-xs flex items-center justify-center font-medium">1</span>
            <h3 className="text-xl">{t('flow.step1')}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <input
              className="field-input max-w-xs"
              placeholder={t('common.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="flow-search"
            />
            <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer">
              <input type="checkbox" className="accent-[#C9A84C]" checked={fbhOnly} onChange={(e) => setFbhOnly(e.target.checked)} />
              {t('flow.filterFbh')}
            </label>
            <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer">
              <input type="checkbox" className="accent-[#C9A84C]" checked={wetOnly} onChange={(e) => setWetOnly(e.target.checked)} />
              {t('flow.filterWet')}
            </label>
          </div>

          {(favMaterials.length > 0 || recentMaterials.length > 0) && (
            <div className="mb-5">
              {favMaterials.length > 0 && (
                <>
                  <p className="eyebrow mb-2">{t('flow.favorites')}</p>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {favMaterials.map((m) => (
                      <button key={m.id} className="card p-2 flex items-center gap-2 hover:border-gold/50" onClick={() => chooseMaterial(m)}>
                        <TextureSwatch texture={m.texture} w={44} h={32} className="rounded-sm" />
                        <span className="text-xs">{lang === 'de' ? m.name : m.nameEn}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {recentMaterials.length > 0 && (
                <>
                  <p className="eyebrow mb-2">{t('flow.recent')}</p>
                  <div className="flex gap-2 flex-wrap">
                    {recentMaterials.map((m) => (
                      <button key={m.id} className="card p-2 flex items-center gap-2 hover:border-gold/50" onClick={() => chooseMaterial(m)}>
                        <TextureSwatch texture={m.texture} w={44} h={32} className="rounded-sm" />
                        <span className="text-xs">{lang === 'de' ? m.name : m.nameEn}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {groups.length === 0 ? (
            <div className="border border-dashed border-line rounded p-10 text-center text-muted text-sm">{t('flow.noResults')}</div>
          ) : (
            groups.map(([sub, mats]) => (
              <div key={sub} className="mb-6">
                <p className="eyebrow mb-2">{sub}</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {mats.map((m) => {
                    const warns = allWarnings(m, room.type, room.heightCm);
                    return (
                      <div key={m.id} className="card overflow-hidden group" data-testid={`flow-material-${m.id}`}>
                        <button className="block w-full" onClick={() => chooseMaterial(m)}>
                          <TextureSwatch texture={m.texture} className="w-full h-28" />
                        </button>
                        <div className="p-2.5 flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{lang === 'de' ? m.name : m.nameEn}</p>
                            <div className="flex gap-1 mt-1">
                              {m.tech.fbh !== 'nein' && <Badge tone="muted">FBH</Badge>}
                              {m.tech.nasszelle && <Badge tone="muted">{t('flow.wet')}</Badge>}
                              {warns.some((w) => w.severity === 'warn') && <Badge tone="warn">!</Badge>}
                            </div>
                          </div>
                          <button
                            className={favs.includes(m.id) ? 'text-gold' : 'text-muted hover:text-gold'}
                            onClick={() => toggleFav(m.id)}
                            aria-label={t('flow.favorites')}
                          >
                            <Star size={15} fill={favs.includes(m.id) ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </>
      ) : (
        <>
          {/* ── SCHRITT 2: Ausführung wählen ── */}
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-full bg-gold text-bg text-xs flex items-center justify-center font-medium">2</span>
            <h3 className="text-xl">{t('flow.step2')}</h3>
            <Badge tone="ok"><Check size={11} className="inline mr-0.5" />{lang === 'de' ? currentMat!.name : currentMat!.nameEn}</Badge>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            {isWood && (
              <div className="card p-4">
                <p className="field-label">{t('flow.finish')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {FINISHES.map((f) => (
                    <button
                      key={f.id}
                      className={`px-2.5 py-1 text-xs border rounded ${currentSel.finish === f.id ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
                      onClick={() => patchSel({ finish: f.id })}
                    >
                      {f.de}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {surface === 'boden' && !isTile && (
              <div className="card p-4">
                <p className="field-label">{t('materials.pattern')}</p>
                <div className="grid grid-cols-3 gap-2" data-testid="pattern-options">
                  {PATTERNS.map((pat) => (
                    <button
                      key={pat.id}
                      className={`border rounded p-1.5 text-center ${currentSel.pattern === pat.id ? 'border-gold' : 'border-line hover:border-gold/40'}`}
                      onClick={() => patchSel({ pattern: pat.id })}
                      data-testid={`pattern-${pat.id}`}
                    >
                      <PatternThumb material={currentMat!} pattern={pat.id} />
                      <span className={`text-[11px] mt-1 block ${currentSel.pattern === pat.id ? 'text-gold' : 'text-muted'}`}>{pat.de}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {surface === 'boden' && (
              <div className="card p-4">
                <p className="field-label">{t('flow.direction')}</p>
                <div className="flex gap-1.5">
                  {DIRECTIONS.map((d) => (
                    <button
                      key={d.id}
                      className={`px-3 py-1.5 text-xs border rounded ${currentSel.layingDirection === d.id ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
                      onClick={() => patchSel({ layingDirection: d.id })}
                    >
                      {d.de}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isTile && (
              <>
                <div className="card p-4">
                  <p className="field-label">{t('flow.format')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {TILE_FORMATS.map((f) => (
                      <button
                        key={f}
                        className={`px-3 py-1.5 text-xs border rounded ${currentSel.format === f ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
                        onClick={() => patchSel({ format: f })}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="card p-4">
                  <p className="field-label">{t('flow.grout')}</p>
                  <div className="flex gap-2">
                    {GROUT_COLORS.map((g) => (
                      <button
                        key={g.hex}
                        className={`flex items-center gap-1.5 px-2 py-1.5 border rounded text-xs ${currentSel.groutColor === g.hex ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
                        onClick={() => patchSel({ groutColor: g.hex })}
                      >
                        <span className="w-4 h-4 rounded-sm border border-line inline-block" style={{ background: g.hex }} />
                        {g.de}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="card p-4">
              <p className="field-label">{t('costs.tierSwitch')}</p>
              <div className="flex gap-1.5">
                {(['standard', 'premium', 'luxus'] as PriceTier[]).map((tier) => (
                  <button
                    key={tier}
                    className={`px-3 py-1.5 text-xs border rounded ${currentSel.tier === tier ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
                    onClick={() => patchSel({ tier })}
                  >
                    {t(`common.tier.${tier}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
