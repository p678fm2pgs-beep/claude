import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useT } from '../../hooks';
import { BoardView } from './BoardView';
import { getActiveVariant } from '../roomHelpers';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

/** Vollbild-Board fürs Kundengespräch — nur Blättern zwischen Räumen/Varianten. */
export function PresentationMode() {
  const t = useT();
  const project = useStore((s) => s.project)!;
  const setPresenting = useStore((s) => s.setPresenting);
  const [index, setIndex] = useState(0);

  const rooms = project.rooms;
  const room = rooms[Math.min(index, rooms.length - 1)];
  const variant = room ? getActiveVariant(room) : undefined;

  return (
    <div className="fixed inset-0 bg-bg z-50 flex flex-col" data-testid="presentation">
      <div className="flex items-center justify-between px-6 py-3 border-b border-line">
        <span className="font-serif text-gold text-lg">{project.name}</span>
        <span className="text-muted text-sm">
          {room?.name} · {index + 1} / {rooms.length}
        </span>
        <button className="btn btn-ghost" onClick={() => setPresenting(false)} data-testid="exit-presentation">
          <X size={16} /> {t('board.exit')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-10 max-w-5xl mx-auto w-full">
        {room && variant ? (
          <BoardView room={room} variant={variant} coverage={project.settings.paintCoverage} />
        ) : (
          <p className="text-muted text-center mt-20">{t('rooms.empty')}</p>
        )}
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-line">
        <button className="btn btn-ghost" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} data-testid="present-prev">
          <ChevronLeft size={18} /> {t('nav.back')}
        </button>
        <button className="btn btn-ghost" onClick={() => setIndex((i) => Math.min(rooms.length - 1, i + 1))} disabled={index >= rooms.length - 1} data-testid="present-next">
          {t('nav.next')} <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
