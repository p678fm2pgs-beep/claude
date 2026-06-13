import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useT } from '../../hooks';
import { PageHeader } from '../../components/ui';
import { getRoom, getActiveVariant } from '../roomHelpers';
import { STYLE_PRESETS } from '../../data/presets';
import { findMaterial } from '../../data/materials';
import { uid } from '../../lib/id';
import { Check } from 'lucide-react';

export function StyleModule({ roomId }: { roomId: string }) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const project = useStore((s) => s.project)!;
  const updateProject = useStore((s) => s.updateProject);
  const room = getRoom(project, roomId)!;
  const [applied, setApplied] = useState<string | null>(null);

  const applyPreset = (presetId: string) => {
    const preset = STYLE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    updateProject((p) => {
      const r = p.rooms.find((x) => x.id === roomId);
      if (!r) return;
      r.stylePreset = presetId;
      const v = r.variants.find((x) => x.id === r.activeVariantId) ?? r.variants[0];
      if (!v) return;
      v.colorRoles = { ...preset.colorRoles };
      // Kern-Materialien als Vorschlag setzen (Oberfläche aus Material ableiten).
      v.materials = preset.materialIds
        .map((mid) => findMaterial(mid))
        .filter((m): m is NonNullable<typeof m> => !!m)
        .map((m) => ({ id: uid('ms'), materialId: m.id, surface: m.surface, tier: 'premium' as const }));
    });
    setApplied(presetId);
  };

  const variant = getActiveVariant(room);

  return (
    <div className="p-6 lg:p-8">
      <PageHeader eyebrow={t(`roomType.${room.type}`)} title={t('style.title')} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {STYLE_PRESETS.map((preset) => {
          const isActive = room.stylePreset === preset.id;
          return (
            <div key={preset.id} className={`card p-5 flex flex-col ${isActive ? 'border-gold' : ''}`} data-testid={`preset-${preset.id}`}>
              <h3 className="text-xl mb-1">{lang === 'de' ? preset.name : preset.nameEn}</h3>
              <p className="text-muted text-sm flex-1 mb-4">{lang === 'de' ? preset.description : preset.descriptionEn}</p>
              <button
                className={`btn ${isActive ? 'btn-ghost' : 'btn-primary'}`}
                onClick={() => applyPreset(preset.id)}
                data-testid={`apply-${preset.id}`}
              >
                {applied === preset.id || isActive ? (
                  <>
                    <Check size={15} /> {t('style.applied')}
                  </>
                ) : (
                  t('style.apply')
                )}
              </button>
            </div>
          );
        })}
      </div>
      {variant && variant.materials.length > 0 && (
        <p className="text-muted text-xs mt-6">
          {variant.materials.length} {t('materials.chosen')} · {Object.keys(variant.colorRoles).length} {t('colors.role')}
        </p>
      )}
    </div>
  );
}
