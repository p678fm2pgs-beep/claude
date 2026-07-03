/**
 * HAVEN ATELIER — Digitales Musterbrett (Erweiterung 6 · S9).
 * Live: zeichnet sich bei jeder Änderung der Variante neu; Export als PNG.
 */
import { useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { useT } from '../../hooks';
import { drawMusterbrett, exportBoardPng, BOARD_W, BOARD_H } from '../../lib/musterbrett';
import type { Room, Variant } from '../../types';
import { ImageDown } from 'lucide-react';

export function Musterbrett({ room, variant }: { room: Room; variant: Variant }) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) drawMusterbrett(canvasRef.current, room, variant, lang);
  }, [room, variant, lang]);

  return (
    <div className="card p-4 mt-4" data-testid="musterbrett">
      <div className="flex items-center justify-between mb-3">
        <p className="eyebrow">{t('board.musterbrett')}</p>
        <button
          className="btn btn-ghost text-xs py-1.5"
          onClick={() => {
            if (canvasRef.current) {
              exportBoardPng(canvasRef.current, `haven-musterbrett-${room.name}-${variant.name}.png`);
            }
          }}
          data-testid="musterbrett-export"
        >
          <ImageDown size={13} /> {t('board.musterbrettPng')}
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={BOARD_W}
        height={BOARD_H}
        className="w-full h-auto rounded border border-line"
        data-testid="musterbrett-canvas"
      />
    </div>
  );
}
