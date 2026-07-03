import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useT } from '../../hooks';
import { PageHeader, Badge } from '../../components/ui';
import { getRoom, getActiveVariant } from '../roomHelpers';
import { ColorBrowser } from './ColorBrowser';
import { COLOR_FAMILIES, findTone, type ColorTone } from '../../data/colors';
import {
  companionRecommendations,
  antiRecommendations,
  SIGNATURE_COMBOS,
  balance606030,
  suggestCeilingTone,
} from '../../lib/harmony';
import type { ColorRole } from '../../types';

const ROLES: ColorRole[] = ['wand', 'boden', 'decke', 'akzent', 'textil'];

export function ColorsModule({ roomId }: { roomId: string }) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const project = useStore((s) => s.project)!;
  const updateProject = useStore((s) => s.updateProject);
  const room = getRoom(project, roomId)!;
  const variant = getActiveVariant(room)!;
  const [familyId, setFamilyId] = useState('weiss');
  const [toneId, setToneId] = useState<string | null>(null);
  // Erweiterung 6 · S5: zusätzliche Browser-Ansicht — Familienansicht bleibt Standard.
  const [view, setView] = useState<'familien' | 'browser'>('familien');

  const family = COLOR_FAMILIES.find((f) => f.id === familyId)!;
  const tone = toneId ? findTone(toneId) : undefined;

  const assignRole = (role: ColorRole, tid: string) =>
    updateProject((p) => {
      const r = p.rooms.find((x) => x.id === roomId);
      const v = r?.variants.find((x) => x.id === r.activeVariantId);
      if (v) v.colorRoles[role] = tid;
    });

  const recs = tone ? companionRecommendations(tone.id) : [];
  const antis = tone ? antiRecommendations(tone.id) : [];
  const balance = balance606030(variant.colorRoles);
  const ceiling = suggestCeilingTone(variant.colorRoles.wand);

  return (
    <div className="p-6 lg:p-8">
      <PageHeader eyebrow={t(`roomType.${room.type}`)} title={t('colors.title')} />

      {/* Ansicht: HAVEN-Familien (Standard) oder Farb-Browser (Erweiterung 6 · S5) */}
      <div className="flex gap-2 mb-5" data-testid="color-views">
        {(['familien', 'browser'] as const).map((v) => (
          <button
            key={v}
            className={`px-3 py-1.5 text-sm border rounded ${view === v ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
            onClick={() => setView(v)}
            data-testid={`color-view-${v}`}
          >
            {t(v === 'familien' ? 'colors.viewFamilies' : 'colors.viewBrowser')}
          </button>
        ))}
      </div>

      {view === 'browser' && (
        <ColorBrowser roomId={roomId} onAssign={assignRole} roles={variant.colorRoles} />
      )}

      {/* Familien */}
      <div className={`flex flex-wrap gap-2 mb-5 ${view === 'browser' ? 'hidden' : ''}`} data-testid="color-families">
        {COLOR_FAMILIES.map((f) => (
          <button
            key={f.id}
            className={`px-3 py-1.5 text-sm border rounded transition-colors ${familyId === f.id ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
            onClick={() => {
              setFamilyId(f.id);
              setToneId(null);
            }}
            data-testid={`family-${f.id}`}
          >
            {lang === 'de' ? f.name : f.nameEn}
          </button>
        ))}
      </div>

      <div className={`grid lg:grid-cols-[1fr_380px] gap-6 ${view === 'browser' ? 'hidden' : ''}`}>
        {/* Ton-Raster auf heller Fläche */}
        <div className="board-surface rounded p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" data-testid="tone-grid">
            {family.tones.map((tn) => (
              <button
                key={tn.id}
                className={`text-left rounded overflow-hidden border ${toneId === tn.id ? 'ring-2 ring-[#C9A84C]' : 'border-black/10'}`}
                onClick={() => setToneId(tn.id)}
                data-testid={`tone-${tn.id}`}
              >
                <div className="h-16" style={{ background: tn.hex }} />
                <div className="p-2 bg-white">
                  <p className="text-[#1A1814] text-sm font-medium">{tn.name}</p>
                  <p className="text-[#6b6256] text-[10px]">{tn.ral} · {tn.ncs}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detailpanel */}
        <div className="space-y-4">
          {tone ? (
            <ToneDetail
              tone={tone}
              onAssign={assignRole}
              roles={variant.colorRoles}
              t={t}
              recs={recs}
              antis={antis}
              lang={lang}
            />
          ) : (
            <div className="card p-6 text-muted text-sm">{t('colors.tone')} —</div>
          )}

          {/* 60-30-10 */}
          <div className="card p-4">
            <p className="eyebrow mb-3">{t('colors.balance')}</p>
            <div className="flex h-6 rounded overflow-hidden border border-line" data-testid="balance-bar">
              {balance.shares.map((s) => {
                const tn = findTone(variant.colorRoles[s.role]);
                return (
                  <div
                    key={s.role}
                    style={{ width: `${s.pct}%`, background: tn?.hex ?? '#333' }}
                    title={`${t(`colors.role.${s.role}`)} ${s.pct}%`}
                  />
                );
              })}
            </div>
            {balance.skewed && <p className="field-error mt-2">{t('harmony.balance.skewed')}</p>}
          </div>

          {/* Decken-Vorschlag */}
          <div className="card p-4 flex items-center justify-between">
            <div>
              <p className="eyebrow mb-1">{t('colors.suggestCeiling')}</p>
              <p className="text-sm">{ceiling.name}</p>
            </div>
            <button className="btn btn-ghost" onClick={() => assignRole('decke', ceiling.id)} data-testid="apply-ceiling">
              {t('colors.assignRole')}
            </button>
          </div>
        </div>
      </div>

      {/* Signature-Kombinationen */}
      <div className="mt-8">
        <p className="eyebrow mb-3">{t('colors.signature')}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="signature-combos">
          {SIGNATURE_COMBOS.map((combo) => (
            <div key={combo.id} className="card p-4">
              <div className="flex gap-1 mb-2">
                {combo.toneIds.map((tid) => {
                  const tn = findTone(tid);
                  return <div key={tid} className="h-8 flex-1 rounded-sm border border-line" style={{ background: tn?.hex }} title={tn?.name} />;
                })}
              </div>
              <p className="text-sm font-medium">{lang === 'de' ? combo.name : combo.nameEn}</p>
              <p className="text-muted text-xs">{lang === 'de' ? combo.materialHint : combo.materialHintEn}</p>
              <button
                className="btn btn-ghost w-full mt-3 text-xs py-1.5"
                onClick={() =>
                  updateProject((p) => {
                    const r = p.rooms.find((x) => x.id === roomId);
                    const v = r?.variants.find((x) => x.id === r.activeVariantId);
                    if (!v) return;
                    const [wand, boden, akzent] = combo.toneIds;
                    v.colorRoles = { ...v.colorRoles, wand, boden, akzent };
                  })
                }
              >
                {t('colors.applyRecommendation')}
              </button>
            </div>
          ))}
        </div>
      </div>

      <p className="text-muted text-xs mt-8 border-t border-line pt-4" data-testid="honesty-note">
        {t('colors.honesty')}
      </p>
    </div>
  );
}

function ToneDetail({
  tone,
  onAssign,
  roles,
  t,
  recs,
  antis,
  lang,
}: {
  tone: ColorTone;
  onAssign: (role: ColorRole, tid: string) => void;
  roles: Record<string, string | undefined>;
  t: (k: string, p?: Record<string, string | number>) => string;
  recs: ReturnType<typeof companionRecommendations>;
  antis: ReturnType<typeof antiRecommendations>;
  lang: 'de' | 'en';
}) {
  return (
    <>
      <div className="card overflow-hidden">
        <div className="h-28" style={{ background: tone.hex }} />
        <div className="p-4">
          <h3 className="text-xl">{tone.name}</h3>
          <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted">
            <span>{tone.ral}</span>
            <span>·</span>
            <span>{tone.ncs}</span>
            <span>·</span>
            <span>{t('colors.lrv')} {tone.lrv}</span>
            <span>·</span>
            <Badge tone="muted">{t(`undertone.${tone.undertone}`)}</Badge>
          </div>
          <div className="mt-4">
            <p className="field-label">{t('colors.assignRole')}</p>
            <div className="flex flex-wrap gap-1.5">
              {ROLES.map((role) => (
                <button
                  key={role}
                  className={`px-2.5 py-1 text-xs border rounded ${roles[role] === tone.id ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
                  onClick={() => onAssign(role, tone.id)}
                  data-testid={`assign-${role}`}
                >
                  {t(`colors.role.${role}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <p className="eyebrow mb-3">{t('colors.recommendations')}</p>
        <div className="space-y-2" data-testid="recommendations">
          {recs.map((r) => (
            <div key={r.kind} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm border border-line shrink-0" style={{ background: r.tone.hex }} />
              <div className="min-w-0 flex-1">
                <p className="text-sm">{r.tone.name}</p>
                <p className="text-muted text-[11px] leading-snug">{t(r.reasonKey)}</p>
              </div>
              <button className="text-gold text-xs hover:underline shrink-0" onClick={() => onAssign('akzent', r.tone.id)}>
                {t('colors.applyRecommendation')}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <p className="eyebrow mb-3">{t('colors.anti')}</p>
        <div className="space-y-2" data-testid="anti-recommendations">
          {antis.map((a) => (
            <div key={a.tone.id} className="flex items-center gap-3 opacity-80">
              <div className="w-8 h-8 rounded-sm border border-danger/40 shrink-0 relative" style={{ background: a.tone.hex }}>
                <span className="absolute inset-0 flex items-center justify-center text-danger text-lg">×</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm">{a.tone.name}</p>
                <p className="text-danger/80 text-[11px] leading-snug">{t(a.reasonKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">{lang}</span>
    </>
  );
}
