/**
 * HAVEN ATELIER — Digitale Freigabe mit Unterschrift (Erweiterung 8 · T8).
 * Finger-/Maus-Signatur auf Canvas, gespeichert mit Zeitstempel + Variantenstand.
 * Erscheint anschließend im exportierten Lookbook (Freigabe-Seite).
 */
import { useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { useT } from '../../hooks';
import { computeProjectCost } from '../../lib/projectCost';
import { formatEUR } from '../../lib/format';
import { uid } from '../../lib/id';
import type { Approval } from '../../types';
import { X } from 'lucide-react';

export function ApprovalDialog({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const project = useStore((s) => s.project)!;
  const updateProject = useStore((s) => s.updateProject);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  const cost = computeProjectCost(project);
  const sumLabel = `${formatEUR(cost.net.min, lang)} – ${formatEUR(cost.net.max, lang)}`;
  const activeRoom = project.rooms[0];
  const variantId = activeRoom?.activeVariantId ?? '';

  const pos = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };
  const start = (e: React.PointerEvent) => {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext('2d')!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.strokeStyle = '#1A1814';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setHasInk(true);
  };
  const end = () => {
    drawing.current = false;
  };
  const clear = () => {
    const c = canvasRef.current!;
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  };

  const save = () => {
    const png = canvasRef.current!.toDataURL('image/png');
    const approval: Approval = {
      id: uid('appr'),
      variantId,
      roomId: activeRoom?.id,
      signaturePng: png,
      timestamp: Date.now(),
      sumLabel,
    };
    updateProject((p) => {
      p.approvals = [...(p.approvals ?? []), approval];
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="card max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()} data-testid="approval-dialog">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-2xl">{t('approval.title')}</h3>
          <button className="text-muted hover:text-gold" onClick={onClose} aria-label={t('common.cancel')}>
            <X size={20} />
          </button>
        </div>
        <p className="text-sm mb-1">{project.name}</p>
        <p className="text-gold text-lg mb-4">{t('approval.sum')}: {sumLabel}</p>
        <p className="text-muted text-xs mb-3">{t('approval.signHint')}</p>
        <canvas
          ref={canvasRef}
          width={460}
          height={160}
          className="w-full bg-white rounded border border-line touch-none"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          data-testid="signature-canvas"
        />
        <p className="text-muted text-[10px] mt-2">{t('approval.legalNote')}</p>
        <div className="flex gap-2 justify-end mt-4">
          <button className="btn btn-ghost" onClick={clear} data-testid="signature-clear">
            {t('approval.clear')}
          </button>
          <button className="btn btn-primary" onClick={save} disabled={!hasInk} data-testid="signature-save">
            {t('approval.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
