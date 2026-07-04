import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useT } from '../../hooks';
import { PageHeader } from '../../components/ui';
import { getRoom, getActiveVariant } from '../roomHelpers';
import { STYLE_PRESETS } from '../../data/presets';
import { SIGNATURE_LOOKS, findLook, applyLookToVariant, type SignatureLook } from '../../data/signatureLooks';
import { findMaterial } from '../../data/materials';
import { findTone } from '../../data/colors';
import { uid } from '../../lib/id';
import { Check, Sparkles, X } from 'lucide-react';

export function StyleModule({ roomId }: { roomId: string }) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const project = useStore((s) => s.project)!;
  const updateProject = useStore((s) => s.updateProject);
  const room = getRoom(project, roomId)!;
  const [applied, setApplied] = useState<string | null>(null);
  // Erweiterung 6 · S8: Signature Looks — Anwenden nur nach Bestätigung.
  const [confirmLook, setConfirmLook] = useState<SignatureLook | null>(null);
  const [appliedLook, setAppliedLook] = useState<string | null>(null);

  const applyLook = (lookId: string) => {
    const look = findLook(lookId);
    if (!look) return;
    updateProject((p) => {
      const r = p.rooms.find((x) => x.id === roomId);
      const v = r?.variants.find((x) => x.id === r.activeVariantId);
      if (v) applyLookToVariant(v, look);
    });
    setAppliedLook(lookId);
    setConfirmLook(null);
  };

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
      {/* HAVEN Signature Looks (Erweiterung 6 · S8) */}
      <div className="mt-10">
        <p className="eyebrow mb-1">{t('style.signature')}</p>
        <p className="text-muted text-sm mb-4">{t('style.signatureIntro')}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="signature-looks">
          {SIGNATURE_LOOKS.map((look) => {
            const strip = ['wand', 'boden', 'akzent', 'textil'] as const;
            return (
              <div key={look.id} className="card p-4 flex flex-col" data-testid={`look-${look.id}`}>
                <div className="flex gap-1 mb-3">
                  {strip.map((role) => {
                    const tn = findTone(look.colorRoles[role]);
                    return tn ? (
                      <div key={role} className="h-9 flex-1 rounded-sm border border-line" style={{ background: tn.hex }} title={`${t(`colors.role.${role}`)}: ${tn.name}`} />
                    ) : null;
                  })}
                </div>
                <h3 className="text-lg leading-tight">{lang === 'de' ? look.name : look.nameEn}</h3>
                <p className="text-muted text-xs flex-1 mt-1 mb-3">{lang === 'de' ? look.claim : look.claimEn}</p>
                <p className="text-muted text-[11px] mb-3">
                  {findMaterial(look.floor.materialId)?.name} · {findMaterial(look.wall.materialId)?.name}
                </p>
                <button
                  className={`btn ${appliedLook === look.id ? 'btn-ghost' : 'btn-primary'} text-xs py-1.5`}
                  onClick={() => setConfirmLook(look)}
                  data-testid={`apply-look-${look.id}`}
                >
                  {appliedLook === look.id ? (
                    <>
                      <Check size={13} /> {t('style.lookApplied')}
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} /> {t('style.lookApply')}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bestätigungsdialog */}
      {confirmLook && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6" onClick={() => setConfirmLook(null)}>
          <div className="card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()} data-testid="look-confirm">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl">{t('style.lookConfirmTitle')}</h3>
              <button className="text-muted hover:text-gold" onClick={() => setConfirmLook(null)} aria-label={t('common.cancel')}>
                <X size={18} />
              </button>
            </div>
            <p className="text-sm mb-1">{lang === 'de' ? confirmLook.name : confirmLook.nameEn}</p>
            <p className="text-muted text-sm mb-5">{t('style.lookConfirmBody')}</p>
            <div className="flex gap-2 justify-end">
              <button className="btn btn-ghost" onClick={() => setConfirmLook(null)} data-testid="look-cancel">
                {t('common.cancel')}
              </button>
              <button className="btn btn-primary" onClick={() => applyLook(confirmLook.id)} data-testid="look-confirm-apply">
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {variant && variant.materials.length > 0 && (
        <p className="text-muted text-xs mt-6">
          {variant.materials.length} {t('materials.chosen')} · {Object.keys(variant.colorRoles).length} {t('colors.role')}
        </p>
      )}
    </div>
  );
}
