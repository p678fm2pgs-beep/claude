/**
 * HAVEN ATELIER — Live-Budget-Regler (Erweiterung 6 · S10).
 * Drei Stufen (Standard/Premium/Luxus): Preis läuft animiert mit, Anwenden
 * setzt die Stufe aller Material-/Möbel-Auswahlen — erst nach Bestätigung.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { useT } from '../../hooks';
import { TIERS, computeProjectCostAtTier, applyTierToProject } from '../../lib/budget';
import { formatEUR } from '../../lib/format';
import type { PriceTier } from '../../types';
import { SlidersHorizontal, X } from 'lucide-react';

/** Zählt einen Wert weich hoch/herunter (rAF, ~400 ms Ease-out). */
function useAnimatedNumber(target: number): number {
  const [value, setValue] = useState(target);
  const raf = useRef<number>();
  useEffect(() => {
    const from = value;
    const delta = target - from;
    if (delta === 0) return;
    const t0 = performance.now();
    const dur = 400;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + delta * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return value;
}

export function BudgetSlider() {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const project = useStore((s) => s.project)!;
  const updateProject = useStore((s) => s.updateProject);
  const [idx, setIdx] = useState(1); // Start: Premium
  const [confirm, setConfirm] = useState(false);
  const tier: PriceTier = TIERS[idx];

  const costs = useMemo(
    () => TIERS.map((tr) => computeProjectCostAtTier(project, tr)),
    [project],
  );
  const cost = costs[idx];
  const mid = Math.round((cost.gross.min + cost.gross.max) / 2);
  const animated = useAnimatedNumber(mid);

  const apply = () => {
    updateProject((p) => applyTierToProject(p, tier));
    setConfirm(false);
  };

  return (
    <div className="card p-4 mb-5" data-testid="budget-slider">
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal size={14} className="text-gold" />
        <p className="eyebrow">{t('budget.title')}</p>
      </div>

      <input
        type="range"
        min={0}
        max={2}
        step={1}
        value={idx}
        onChange={(e) => setIdx(Number(e.target.value))}
        className="w-full accent-[#C9A84C]"
        data-testid="budget-range"
        aria-label={t('budget.title')}
      />
      <div className="flex justify-between text-xs mt-1">
        {TIERS.map((tr, i) => (
          <button
            key={tr}
            className={i === idx ? 'text-gold font-medium' : 'text-muted hover:text-text'}
            onClick={() => setIdx(i)}
            data-testid={`budget-tier-${tr}`}
          >
            {t(`common.tier.${tr}`)}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-muted text-[11px]">{t('budget.grossApprox')}</p>
          <p className="text-2xl text-gold tabular-nums" data-testid="budget-price">
            {formatEUR(animated, lang)}
          </p>
          <p className="text-muted text-[11px]" data-testid="budget-range-label">
            {formatEUR(cost.gross.min, lang)} – {formatEUR(cost.gross.max, lang)}
          </p>
        </div>
        <button className="btn btn-ghost text-xs py-1.5" onClick={() => setConfirm(true)} data-testid="budget-apply">
          {t('budget.apply')}
        </button>
      </div>

      {confirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6" onClick={() => setConfirm(false)}>
          <div className="card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()} data-testid="budget-confirm">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl">{t('budget.confirmTitle')}</h3>
              <button className="text-muted hover:text-gold" onClick={() => setConfirm(false)} aria-label={t('common.cancel')}>
                <X size={18} />
              </button>
            </div>
            <p className="text-muted text-sm mb-5">
              {t('budget.confirmBody', { tier: t(`common.tier.${tier}`) })}
            </p>
            <div className="flex gap-2 justify-end">
              <button className="btn btn-ghost" onClick={() => setConfirm(false)} data-testid="budget-cancel">
                {t('common.cancel')}
              </button>
              <button className="btn btn-primary" onClick={apply} data-testid="budget-confirm-apply">
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
