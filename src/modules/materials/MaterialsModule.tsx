import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useT } from '../../hooks';
import { PageHeader, Badge } from '../../components/ui';
import { TextureSwatch } from '../../components/TextureSwatch';
import { getRoom, getActiveVariant } from '../roomHelpers';
import { MATERIALS, MATERIAL_CATEGORIES, findMaterial, type Material } from '../../data/materials';
import { findAddon } from '../../data/addons';
import { findTone } from '../../data/colors';
import { allWarnings } from '../../lib/suitability';
import { uid } from '../../lib/id';
import type { PriceTier } from '../../types';
import { X, Plus } from 'lucide-react';

export function MaterialsModule({ roomId }: { roomId: string }) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const project = useStore((s) => s.project)!;
  const updateProject = useStore((s) => s.updateProject);
  const room = getRoom(project, roomId)!;
  const variant = getActiveVariant(room)!;
  const [category, setCategory] = useState(MATERIAL_CATEGORIES[0]);
  const [detail, setDetail] = useState<Material | null>(null);

  const list = MATERIALS.filter((m) => m.category === category);

  const addMaterial = (m: Material) =>
    updateProject((p) => {
      const r = p.rooms.find((x) => x.id === roomId);
      const v = r?.variants.find((x) => x.id === r.activeVariantId);
      if (v) v.materials.push({ id: uid('ms'), materialId: m.id, surface: m.surface, tier: 'premium' });
    });

  const removeSelection = (selId: string) =>
    updateProject((p) => {
      const r = p.rooms.find((x) => x.id === roomId);
      const v = r?.variants.find((x) => x.id === r.activeVariantId);
      if (v) v.materials = v.materials.filter((s) => s.id !== selId);
    });

  const setTier = (selId: string, tier: PriceTier) =>
    updateProject((p) => {
      const r = p.rooms.find((x) => x.id === roomId);
      const v = r?.variants.find((x) => x.id === r.activeVariantId);
      const sel = v?.materials.find((s) => s.id === selId);
      if (sel) sel.tier = tier;
    });

  return (
    <div className="p-6 lg:p-8">
      <PageHeader eyebrow={t(`roomType.${room.type}`)} title={t('materials.title')} />

      <div className="flex flex-wrap gap-2 mb-5" data-testid="material-categories">
        {MATERIAL_CATEGORIES.map((c) => (
          <button
            key={c}
            className={`px-3 py-1.5 text-sm border rounded ${category === c ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
            onClick={() => setCategory(c)}
            data-testid={`matcat-${c}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="material-grid">
        {list.map((m) => {
          const warns = allWarnings(m, room.type, room.heightCm);
          return (
            <div key={m.id} className="card overflow-hidden flex flex-col" data-testid="material-tile">
              <button className="block group" onClick={() => setDetail(m)}>
                <TextureSwatch texture={m.texture} className="w-full h-32 object-cover group-hover:opacity-90 transition-opacity" />
              </button>
              <div className="p-3 flex-1 flex flex-col">
                <p className="text-sm font-medium">{lang === 'de' ? m.name : m.nameEn}</p>
                <p className="text-muted text-[11px] mb-2">{m.subcategory}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  <Badge tone="muted">{t(`materials.surface.${m.surface}`)}</Badge>
                  {warns.length > 0 && <Badge tone="warn">!</Badge>}
                </div>
                <button className="btn btn-primary text-xs py-1.5 mt-auto" onClick={() => addMaterial(m)} data-testid={`add-material-${m.id}`}>
                  <Plus size={13} /> {t('materials.choose')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Gewählte Materialien */}
      <div className="mt-8">
        <p className="eyebrow mb-3">{t('materials.chosen')}</p>
        {variant.materials.length === 0 ? (
          <p className="text-muted text-sm">{t('empty.generic')}</p>
        ) : (
          <div className="space-y-2" data-testid="chosen-materials">
            {variant.materials.map((sel) => {
              const m = findMaterial(sel.materialId);
              if (!m) return null;
              const warns = allWarnings(m, room.type, room.heightCm);
              const match = colorMatch(m, variant.colorRoles);
              return (
                <div key={sel.id} className="card p-3 flex items-center gap-3">
                  <TextureSwatch texture={m.texture} w={64} h={48} className="rounded shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{lang === 'de' ? m.name : m.nameEn}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge tone="muted">{t(`materials.surface.${m.surface}`)}</Badge>
                      <Badge tone={match.tone}>{t(`materials.match.${match.key}`)}</Badge>
                    </div>
                    {warns.map((w, i) => (
                      <p key={i} className={`text-[11px] mt-1 ${w.severity === 'warn' ? 'text-danger/90' : 'text-muted'}`} data-testid="suit-warning">
                        {t(w.code)}
                      </p>
                    ))}
                  </div>
                  <select className="field-input text-xs w-28" value={sel.tier} onChange={(e) => setTier(sel.id, e.target.value as PriceTier)}>
                    {(['standard', 'premium', 'luxus'] as PriceTier[]).map((tier) => (
                      <option key={tier} value={tier}>{t(`common.tier.${tier}`)}</option>
                    ))}
                  </select>
                  <button className="text-muted hover:text-danger" onClick={() => removeSelection(sel.id)} aria-label={t('common.delete')}>
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {detail && <MaterialDetail material={detail} roomType={room.type} heightCm={room.heightCm} onClose={() => setDetail(null)} onAdd={() => { addMaterial(detail); setDetail(null); }} />}
    </div>
  );
}

/** Ampel-Abgleich Material ↔ gewählte Farben (harmoniert/neutral/Spannung). */
function colorMatch(
  material: Material,
  roles: Record<string, string | undefined>,
): { key: 'harmoniert' | 'neutral' | 'spannung'; tone: 'ok' | 'muted' | 'danger' } {
  const toneIds = Object.values(roles).filter(Boolean) as string[];
  if (toneIds.length === 0) return { key: 'neutral', tone: 'muted' };
  const undertones = toneIds.map((id) => findTone(id)?.undertone).filter(Boolean);
  const materialWarm = material.tags.includes('warm');
  const materialCool = material.tags.includes('kühl') || material.tags.includes('kuehl');
  const warmCount = undertones.filter((u) => u === 'warm').length;
  const coolCount = undertones.filter((u) => u === 'kuehl').length;
  if (materialWarm && coolCount > warmCount) return { key: 'spannung', tone: 'danger' };
  if (materialCool && warmCount > coolCount) return { key: 'spannung', tone: 'danger' };
  if (materialWarm && warmCount >= coolCount) return { key: 'harmoniert', tone: 'ok' };
  if (materialCool && coolCount >= warmCount) return { key: 'harmoniert', tone: 'ok' };
  return { key: 'neutral', tone: 'muted' };
}

function MaterialDetail({
  material,
  roomType,
  heightCm,
  onClose,
  onAdd,
}: {
  material: Material;
  roomType: import('../../types').RoomType;
  heightCm: number;
  onClose: () => void;
  onAdd: () => void;
}) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const warns = allWarnings(material, roomType, heightCm);
  const tech = material.tech;
  const specs: [string, string][] = [];
  if (tech.nutzungsklasse) specs.push([t('tech.nutzungsklasse'), tech.nutzungsklasse]);
  if (tech.staerkeMm) specs.push([t('tech.staerke'), `${tech.staerkeMm} mm`]);
  if (tech.nutzschichtMm) specs.push([t('tech.nutzschicht'), `${tech.nutzschichtMm} mm`]);
  if (tech.format) specs.push([t('tech.format'), tech.format]);
  if (tech.rutschklasse) specs.push([t('tech.rutschklasse'), tech.rutschklasse]);
  specs.push([t('tech.fbh'), tech.fbh === 'ja' ? t('tech.yes') : tech.fbh === 'nein' ? t('tech.no') : t('tech.conditional')]);
  specs.push([t('tech.nasszelle'), tech.nasszelle ? t('tech.yes') : t('tech.no')]);
  specs.push([t('tech.aussen'), tech.aussen ? t('tech.yes') : t('tech.no')]);
  if (tech.emission) specs.push([t('tech.emission'), tech.emission]);
  if (tech.pflege) specs.push([t('tech.pflege'), tech.pflege]);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="card max-w-2xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <TextureSwatch texture={material.texture} w={680} h={260} className="w-full" />
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl">{lang === 'de' ? material.name : material.nameEn}</h3>
              <p className="text-muted text-sm">{material.category} · {material.subcategory}</p>
            </div>
            <button className="text-muted hover:text-gold" onClick={onClose}><X size={20} /></button>
          </div>
          <p className="text-sm mt-3">{lang === 'de' ? material.description : material.descriptionEn}</p>

          <p className="eyebrow mt-5 mb-2">{t('materials.tech')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm" data-testid="spec-bar">
            {specs.map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-line py-1">
                <span className="text-muted text-xs">{k}</span>
                <span className="text-xs">{v}</span>
              </div>
            ))}
          </div>

          {material.addons.length > 0 && (
            <>
              <p className="eyebrow mt-5 mb-2">{t('materials.addons')}</p>
              <div className="flex flex-wrap gap-1.5">
                {material.addons.map((aid) => {
                  const a = findAddon(aid);
                  return a ? <Badge key={aid} tone="muted">{lang === 'de' ? a.name : a.nameEn}</Badge> : null;
                })}
              </div>
            </>
          )}

          {warns.length > 0 && (
            <div className="mt-5 space-y-1">
              {warns.map((w, i) => (
                <p key={i} className={`text-xs ${w.severity === 'warn' ? 'text-danger' : 'text-muted'}`}>{t(w.code)}</p>
              ))}
            </div>
          )}

          <button className="btn btn-primary w-full mt-6" onClick={onAdd}>
            <Plus size={15} /> {t('materials.choose')}
          </button>
        </div>
      </div>
    </div>
  );
}
