import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useT } from '../../hooks';
import { PageHeader, EmptyState } from '../../components/ui';
import { getRoom, getActiveVariant } from '../roomHelpers';
import { furnitureForRoom, findFurnitureType } from '../../data/furniture';
import { tradesForRoom, findTrade } from '../../data/prices';
import { formatEUR } from '../../lib/format';
import { uid } from '../../lib/id';
import type { PriceTier } from '../../types';
import { Plus, X } from 'lucide-react';

export function FurnitureModule({ roomId }: { roomId: string }) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const project = useStore((s) => s.project)!;
  const updateProject = useStore((s) => s.updateProject);
  const room = getRoom(project, roomId)!;
  const variant = getActiveVariant(room)!;
  const [customName, setCustomName] = useState('');

  const mutate = (fn: (v: NonNullable<ReturnType<typeof getActiveVariant>>) => void) =>
    updateProject((p) => {
      const r = p.rooms.find((x) => x.id === roomId);
      const v = r?.variants.find((x) => x.id === r.activeVariantId);
      if (v) fn(v);
    });

  const addFurniture = (typeId: string) => {
    const ft = findFurnitureType(typeId);
    if (!ft) return;
    mutate((v) => v.furniture.push({ id: uid('fi'), typeId, label: lang === 'de' ? ft.name : ft.nameEn, tier: 'premium', quantity: ft.defaultQty, unit: ft.unit }));
  };

  const addCustom = () => {
    if (!customName.trim()) return;
    mutate((v) => v.furniture.push({ id: uid('fi'), typeId: 'custom', label: customName.trim(), tier: 'premium', quantity: 1, unit: 'Stk' }));
    setCustomName('');
  };

  const addTrade = (tradeId: string) => {
    const tr = findTrade(tradeId);
    if (!tr) return;
    mutate((v) => v.trades.push({ id: uid('ts'), tradeId, tier: 'premium', quantity: 1 }));
  };

  const suggestions = furnitureForRoom(room.type);
  const trades = tradesForRoom(room.type);

  return (
    <div className="p-6 lg:p-8">
      <PageHeader eyebrow={t(`roomType.${room.type}`)} title={t('furniture.title')} />

      {/* Vorschläge */}
      <div className="flex flex-wrap gap-2 mb-5" data-testid="furniture-suggestions">
        {suggestions.map((ft) => (
          <button key={ft.id} className="px-3 py-1.5 text-sm border border-line rounded text-muted hover:text-gold hover:border-gold/40" onClick={() => addFurniture(ft.id)} data-testid={`add-furniture-${ft.id}`}>
            <Plus size={12} className="inline mr-1" />
            {lang === 'de' ? ft.name : ft.nameEn}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-6 max-w-md">
        <input className="field-input" placeholder={t('furniture.custom')} value={customName} onChange={(e) => setCustomName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCustom()} />
        <button className="btn btn-ghost" onClick={addCustom}>{t('common.add')}</button>
      </div>

      {variant.furniture.length === 0 ? (
        <EmptyState title={t('furniture.empty')} />
      ) : (
        <div className="space-y-2 mb-8" data-testid="furniture-list">
          {variant.furniture.map((item) => {
            const ft = findFurnitureType(item.typeId);
            const range = ft ? ft.price[item.tier] : [0, 0];
            return (
              <div key={item.id} className="card p-3 flex items-center gap-3 flex-wrap">
                <span className="flex-1 min-w-[140px] text-sm">{item.label}</span>
                <input
                  type="number"
                  min={1}
                  className="field-input w-20 text-sm"
                  value={item.quantity}
                  onChange={(e) => mutate((v) => { const f = v.furniture.find((x) => x.id === item.id); if (f) f.quantity = Math.max(1, parseInt(e.target.value) || 1); })}
                  data-testid="furniture-qty"
                />
                <span className="text-muted text-xs w-10">{item.unit}</span>
                <select className="field-input w-28 text-sm" value={item.tier} onChange={(e) => mutate((v) => { const f = v.furniture.find((x) => x.id === item.id); if (f) f.tier = e.target.value as PriceTier; })}>
                  {(['standard', 'premium', 'luxus'] as PriceTier[]).map((tier) => (
                    <option key={tier} value={tier}>{t(`common.tier.${tier}`)}</option>
                  ))}
                </select>
                <span className="text-sm w-40 text-right">
                  {formatEUR(range[0] * item.quantity, lang)} – {formatEUR(range[1] * item.quantity, lang)}
                </span>
                <button className="text-muted hover:text-danger" onClick={() => mutate((v) => { v.furniture = v.furniture.filter((x) => x.id !== item.id); })}>
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Gewerke & Technik */}
      {trades.length > 0 && (
        <>
          <p className="eyebrow mb-3">{t('trades.title')}</p>
          <div className="flex flex-wrap gap-2 mb-4" data-testid="trade-suggestions">
            {trades.map((tr) => (
              <button key={tr.id} className="px-3 py-1.5 text-sm border border-line rounded text-muted hover:text-gold hover:border-gold/40" onClick={() => addTrade(tr.id)} data-testid={`add-trade-${tr.id}`}>
                <Plus size={12} className="inline mr-1" />
                {lang === 'de' ? tr.name : tr.nameEn}
              </button>
            ))}
          </div>
          {variant.trades.length > 0 && (
            <div className="space-y-2" data-testid="trade-list">
              {variant.trades.map((ts) => {
                const tr = findTrade(ts.tradeId);
                if (!tr) return null;
                const range = tr.prices[ts.tier];
                return (
                  <div key={ts.id} className="card p-3 flex items-center gap-3 flex-wrap">
                    <span className="flex-1 min-w-[140px] text-sm">{lang === 'de' ? tr.name : tr.nameEn}</span>
                    <input
                      type="number"
                      min={1}
                      className="field-input w-20 text-sm"
                      value={ts.quantity}
                      onChange={(e) => mutate((v) => { const x = v.trades.find((y) => y.id === ts.id); if (x) x.quantity = Math.max(1, parseInt(e.target.value) || 1); })}
                    />
                    <span className="text-muted text-xs w-12">{tr.unit}</span>
                    <select className="field-input w-28 text-sm" value={ts.tier} onChange={(e) => mutate((v) => { const x = v.trades.find((y) => y.id === ts.id); if (x) x.tier = e.target.value as PriceTier; })}>
                      {(['standard', 'premium', 'luxus'] as PriceTier[]).map((tier) => (
                        <option key={tier} value={tier}>{t(`common.tier.${tier}`)}</option>
                      ))}
                    </select>
                    <span className="text-sm w-40 text-right">{formatEUR(range[0] * ts.quantity, lang)} – {formatEUR(range[1] * ts.quantity, lang)}</span>
                    <button className="text-muted hover:text-danger" onClick={() => mutate((v) => { v.trades = v.trades.filter((y) => y.id !== ts.id); })}>
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
