import { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import { useT } from '../../hooks';
import { PageHeader, EmptyState, Badge } from '../../components/ui';
import { computeProjectCost } from '../../lib/projectCost';
import { formatEUR } from '../../lib/format';
import type { Gewerk } from '../../lib/costs';

const GEWERK_COLORS: Record<string, string> = {
  boden: '#C9A84C', wand: '#9B7F55', decke: '#B6AB97', maler: '#7E8B62', fliesen: '#7E94A0',
  sanitaer: '#5A7488', kueche: '#A9694D', elektro: '#8C9C8A', heizung: '#C16E4F',
  moebel: '#B89568', leuchten: '#D6A93C', nebenposition: '#6E808C', honorar: '#383B3D', reserve: '#92403A',
};

export function CostsModule() {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const project = useStore((s) => s.project)!;
  const mode = useStore((s) => s.mode);
  const expert = mode === 'experte';
  const cost = useMemo(() => computeProjectCost(project), [project]);
  const [openRoom, setOpenRoom] = useState<string | null>(project.rooms[0]?.id ?? null);

  const hasLines = cost.rooms.some((r) => r.lines.length > 0);
  const mid = (a: number, b: number) => Math.round((a + b) / 2);

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        eyebrow={`${t('costs.priceDate')}: ${project.priceListDate}`}
        title={t('costs.title')}
      />

      {!hasLines ? (
        <EmptyState title={t('costs.empty')} />
      ) : (
        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          <div>
            {/* Räume */}
            <div className="space-y-3" data-testid="cost-rooms">
              {cost.rooms.map((rc) => {
                const room = project.rooms.find((r) => r.id === rc.roomId);
                const isOpen = openRoom === rc.roomId;
                return (
                  <div key={rc.roomId} className="card overflow-hidden">
                    <button className="w-full flex items-center justify-between p-4" onClick={() => setOpenRoom(isOpen ? null : rc.roomId)} data-testid={`cost-room-${rc.roomId}`}>
                      <span className="text-lg">{room?.name}</span>
                      <span className="text-sm">
                        {rc.subtotal.min === rc.subtotal.max
                          ? formatEUR(rc.subtotal.min, lang)
                          : `${formatEUR(rc.subtotal.min, lang)} – ${formatEUR(rc.subtotal.max, lang)}`}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-muted text-left border-b border-line">
                              <th className="py-1 font-normal">{t('costs.position')}</th>
                              <th className="py-1 font-normal text-right">{t('costs.qty')}</th>
                              <th className="py-1 font-normal">{t('costs.unit')}</th>
                              <th className="py-1 font-normal text-right">{t('costs.sum')}</th>
                              {expert && <th className="py-1 font-normal text-right">{t('costs.ek')}</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {rc.lines.map((l) => (
                              <tr key={l.id} className="border-b border-line/50">
                                <td className="py-1.5">
                                  {l.label}
                                  {l.meta?.nebenposition ? <span className="text-muted"> ·</span> : null}
                                </td>
                                <td className="py-1.5 text-right">{l.qty}</td>
                                <td className="py-1.5">{l.unit}</td>
                                <td className="py-1.5 text-right">
                                  {l.totalMin === l.totalMax
                                    ? formatEUR(l.totalMin, lang)
                                    : `${formatEUR(l.totalMin, lang)}–${formatEUR(l.totalMax, lang)}`}
                                </td>
                                {expert && (
                                  <td className="py-1.5 text-right text-muted">
                                    {formatEUR(mid(l.ekMin ?? 0, l.ekMax ?? 0), lang)}
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summenblock + Donut */}
          <div className="space-y-4">
            <Donut data={cost.byGewerk} t={t} lang={lang} />

            <div className="card p-5" data-testid="cost-summary">
              <Row label={t('costs.projectSum')} value={rangeStr(cost.baseSubtotal.min, cost.baseSubtotal.max, lang)} />
              <Row label={cost.fee.label} value={formatEUR(mid(cost.fee.totalMin, cost.fee.totalMax), lang)} />
              <Row label={cost.reserve.label} value={formatEUR(mid(cost.reserve.totalMin, cost.reserve.totalMax), lang)} testid="reserve-line" />
              <div className="border-t border-line my-2" />
              <Row label={t('costs.net')} value={rangeStr(cost.net.min, cost.net.max, lang)} strong testid="net-total" />
              <Row label={t('costs.vat')} value={rangeStr(cost.vat.min, cost.vat.max, lang)} />
              <Row label={t('costs.gross')} value={rangeStr(cost.gross.min, cost.gross.max, lang)} strong gold testid="gross-total" />
              {expert && (
                <>
                  <div className="border-t border-line my-2" />
                  <Row label={t('costs.ek')} value={rangeStr(cost.ekTotal.min, cost.ekTotal.max, lang)} muted testid="ek-total" />
                  <Row
                    label={t('costs.margin')}
                    value={rangeStr(cost.baseSubtotal.min - cost.ekTotal.max, cost.baseSubtotal.max - cost.ekTotal.min, lang)}
                    muted
                  />
                </>
              )}
            </div>

            {expert && <Badge tone="gold">EK / Marge sichtbar</Badge>}

            <p className="text-muted text-[11px] leading-snug border-t border-line pt-3" data-testid="cost-disclaimer">
              {t('costs.disclaimer')} ({t('costs.priceDate')}: {project.priceListDate})
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function rangeStr(min: number, max: number, lang: 'de' | 'en') {
  return min === max ? formatEUR(min, lang) : `${formatEUR(min, lang)} – ${formatEUR(max, lang)}`;
}

function Row({ label, value, strong, gold, muted, testid }: { label: string; value: string; strong?: boolean; gold?: boolean; muted?: boolean; testid?: string }) {
  return (
    <div className={`flex items-center justify-between py-1 ${strong ? 'text-base' : 'text-sm'}`} data-testid={testid}>
      <span className={gold ? 'text-gold' : muted ? 'text-muted' : ''}>{label}</span>
      <span className={`${strong ? 'font-medium' : ''} ${gold ? 'text-gold' : muted ? 'text-muted' : ''}`}>{value}</span>
    </div>
  );
}

function Donut({ data, t, lang }: { data: { gewerk: Gewerk; min: number; max: number }[]; t: (k: string) => string; lang: 'de' | 'en' }) {
  void lang;
  const items = data.filter((d) => d.max > 0);
  const total = items.reduce((s, d) => s + (d.min + d.max) / 2, 0) || 1;
  let acc = 0;
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <div className="card p-5">
      <p className="eyebrow mb-3">{t('costs.byGewerk')}</p>
      <div className="flex items-center gap-4">
        <svg width={130} height={130} viewBox="0 0 130 130" data-testid="cost-donut">
          <g transform="translate(65,65) rotate(-90)">
            {items.map((d) => {
              const val = (d.min + d.max) / 2;
              const frac = val / total;
              const dash = frac * c;
              const seg = (
                <circle
                  key={d.gewerk}
                  r={r}
                  fill="none"
                  stroke={GEWERK_COLORS[d.gewerk] ?? '#666'}
                  strokeWidth={16}
                  strokeDasharray={`${dash} ${c - dash}`}
                  strokeDashoffset={-acc * c}
                />
              );
              acc += frac;
              return seg;
            })}
          </g>
        </svg>
        <ul className="text-xs space-y-1 flex-1">
          {items.map((d) => (
            <li key={d.gewerk} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: GEWERK_COLORS[d.gewerk] ?? '#666' }} />
              <span className="capitalize">{d.gewerk}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
