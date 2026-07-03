import { useStore } from '../../store/useStore';
import { useT } from '../../hooks';
import { MiniPlan } from '../../components/MiniPlan';
import { TextureSwatch } from '../../components/TextureSwatch';
import { getActiveVariant } from '../roomHelpers';
import { findTone } from '../../data/colors';
import { findMaterial } from '../../data/materials';
import { computeRoomCost } from '../../lib/projectCost';
import { balance606030 } from '../../lib/harmony';
import { deriveAreas } from '../../lib/geometry';
import { formatEUR, formatArea } from '../../lib/format';
import type { Room, Variant } from '../../types';

/** Editorial-Board einer Variante auf heller Fläche. */
export function BoardView({ room, variant, coverage }: { room: Room; variant: Variant; coverage: number }) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const d = deriveAreas(room.floorplan, room.heightCm);
  const roomForCost: Room = { ...room, activeVariantId: variant.id };
  const rc = computeRoomCost(roomForCost, coverage);
  const balance = balance606030(variant.colorRoles);

  const palette = Object.entries(variant.colorRoles)
    .map(([role, id]) => ({ role, tone: findTone(id) }))
    .filter((x) => x.tone);

  return (
    <div className="board-surface rounded p-6 lg:p-8" data-testid="board-view">
      <div className="flex items-baseline justify-between border-b border-black/10 pb-3 mb-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#9a7d2e]">HAVEN ATELIER</p>
          <h2 className="text-3xl text-[#1A1814] font-serif">{room.name}</h2>
        </div>
        <div className="text-right text-[#6b6256] text-xs">
          <p>{variant.name}</p>
          <p>{formatArea(d.floorAreaM2, lang)} · {(room.heightCm / 100).toFixed(2)} m</p>
          <p>{new Date().toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9a7d2e] mb-2">{t('board.palette')}</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {palette.map(({ role, tone }) => (
              <div key={role} className="w-24">
                <div className="h-16 rounded border border-black/10" style={{ background: tone!.hex }} />
                <p className="text-[#1A1814] text-xs mt-1 font-medium">{tone!.name}</p>
                <p className="text-[#6b6256] text-[10px]">{tone!.ral} · {tone!.ncs}</p>
                <p className="text-[#9a7d2e] text-[10px] uppercase">{t(`colors.role.${role}`)}</p>
              </div>
            ))}
          </div>

          {/* 60-30-10 */}
          {balance.shares.length > 0 && (
            <div className="flex h-4 rounded overflow-hidden border border-black/10 mb-5">
              {balance.shares.map((s) => {
                const tone = findTone(variant.colorRoles[s.role]);
                return <div key={s.role} style={{ width: `${s.pct}%`, background: tone?.hex ?? '#ccc' }} />;
              })}
            </div>
          )}

          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9a7d2e] mb-2">{t('board.materials')}</p>
          <div className="grid grid-cols-3 gap-2">
            {variant.materials.slice(0, 6).map((sel) => {
              const m = findMaterial(sel.materialId);
              if (!m) return null;
              return (
                <div key={sel.id}>
                  <TextureSwatch texture={m.texture} w={120} h={80} className="w-full rounded border border-black/10" />
                  <p className="text-[#1A1814] text-[10px] mt-1">{lang === 'de' ? m.name : m.nameEn}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9a7d2e] mb-2">{t('board.plan')}</p>
          <div className="border border-black/10 rounded mb-5">
            <MiniPlan plan={room.floorplan} heightCm={room.heightCm} width={400} height={240} showDimensions />
          </div>

          {variant.furniture.length > 0 && (
            <>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#9a7d2e] mb-2">{t('board.furniture')}</p>
              <ul className="text-[#1A1814] text-xs space-y-0.5 mb-5">
                {variant.furniture.map((f) => (
                  <li key={f.id}>· {f.label} ({f.quantity} {f.unit})</li>
                ))}
              </ul>
            </>
          )}

          <div className="border-t border-black/10 pt-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#9a7d2e] mb-1">{t('board.costs')}</p>
            <p className="text-[#1A1814] text-lg">
              {rc.subtotal.min === rc.subtotal.max
                ? formatEUR(rc.subtotal.min, lang)
                : `${formatEUR(rc.subtotal.min, lang)} – ${formatEUR(rc.subtotal.max, lang)}`}
            </p>
          </div>

          {variant.notes && <p className="text-[#6b6256] text-xs mt-4 italic">{variant.notes}</p>}
        </div>
      </div>
    </div>
  );
}

export function getRoomActiveVariant(room: Room): Variant | undefined {
  return getActiveVariant(room);
}
