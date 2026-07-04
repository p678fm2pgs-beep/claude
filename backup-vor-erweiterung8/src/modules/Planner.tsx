import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { useT } from '../hooks';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { getRoom } from './roomHelpers';
import { RoomsModule } from './rooms/RoomsModule';
import { LightModule } from './rooms/LightModule';
import { StyleModule } from './style/StyleModule';
import { ColorsModule } from './colors/ColorsModule';
import { MaterialsModule } from './materials/MaterialsModule';
import { FurnitureModule } from './furniture/FurnitureModule';
import { CostsModule } from './costs/CostsModule';
import { BoardModule } from './board/BoardModule';
import { SettingsModule } from './settings/SettingsModule';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

type View = 'rooms' | 'light' | 'style' | 'colors' | 'materials' | 'furniture' | 'costs' | 'board' | 'settings';

const FLOW: View[] = ['rooms', 'light', 'style', 'colors', 'materials', 'furniture', 'costs', 'board'];
const ROOM_VIEWS: View[] = ['light', 'style', 'colors', 'materials', 'furniture', 'board'];

export function Planner() {
  const t = useT();
  const project = useStore((s) => s.project)!;
  const closeProject = useStore((s) => s.closeProject);
  const mode = useStore((s) => s.mode);
  const [view, setView] = useState<View>('rooms');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(project.rooms[0]?.id ?? null);

  // Aktiven Raum konsistent halten.
  useEffect(() => {
    if (!project.rooms.find((r) => r.id === activeRoomId)) {
      setActiveRoomId(project.rooms[0]?.id ?? null);
    }
  }, [project.rooms, activeRoomId]);

  const room = getRoom(project, activeRoomId);
  const needsRoom = ROOM_VIEWS.includes(view);

  const navItems: { view: View; label: string }[] = [
    { view: 'rooms', label: t('nav.rooms') },
    { view: 'light', label: t('nav.light') },
    { view: 'style', label: t('nav.style') },
    { view: 'colors', label: t('nav.colors') },
    { view: 'materials', label: t('nav.materials') },
    { view: 'furniture', label: t('nav.furniture') },
    { view: 'costs', label: t('nav.costs') },
    { view: 'board', label: t('nav.board') },
    { view: 'settings', label: t('nav.settings') },
  ];

  const flowIndex = FLOW.indexOf(view);
  const goNext = () => flowIndex >= 0 && flowIndex < FLOW.length - 1 && setView(FLOW[flowIndex + 1]);
  const goPrev = () => flowIndex > 0 && setView(FLOW[flowIndex - 1]);

  const ensureRoom = () => {
    if (needsRoom && !room) {
      return (
        <div className="p-10">
          <div className="border border-dashed border-line rounded p-12 text-center" data-testid="empty-state">
            <p className="text-lg mb-4">{t('rooms.empty')}</p>
            <button className="btn btn-primary" onClick={() => setView('rooms')}>
              {t('rooms.add')}
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderView = () => {
    const guard = ensureRoom();
    if (guard) return guard;
    switch (view) {
      case 'rooms':
        return <RoomsModule activeRoomId={activeRoomId} onSelectRoom={setActiveRoomId} onContinue={() => setView('light')} />;
      case 'light':
        return <LightModule roomId={room!.id} />;
      case 'style':
        return <StyleModule roomId={room!.id} />;
      case 'colors':
        return <ColorsModule roomId={room!.id} />;
      case 'materials':
        return <MaterialsModule roomId={room!.id} />;
      case 'furniture':
        return <FurnitureModule roomId={room!.id} />;
      case 'costs':
        return <CostsModule />;
      case 'board':
        return <BoardModule roomId={room!.id} />;
      case 'settings':
        return <SettingsModule />;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-57px)]">
      <aside className="w-56 shrink-0 border-r border-line p-4 flex flex-col">
        <button className="text-xs text-muted hover:text-gold flex items-center gap-1 mb-5" onClick={closeProject}>
          <ArrowLeft size={13} /> {t('nav.projects')}
        </button>
        <p className="text-sm font-serif text-lg leading-tight mb-1">{project.name}</p>
        {project.customer && <p className="text-muted text-xs mb-4">{project.customer}</p>}

        {project.rooms.length > 0 && (
          <select
            className="field-input text-sm mb-5"
            value={activeRoomId ?? ''}
            onChange={(e) => setActiveRoomId(e.target.value)}
            data-testid="room-selector"
            aria-label={t('rooms.title')}
          >
            {project.rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        )}

        <nav className="flex flex-col gap-0.5" aria-label="Module">
          {navItems.map((item) => {
            if (item.view === 'settings' && mode !== 'experte') return null;
            return (
              <button
                key={item.view}
                className={`text-left px-3 py-2 text-sm rounded transition-colors ${
                  view === item.view ? 'text-gold bg-gold/10' : 'text-muted hover:text-text'
                }`}
                onClick={() => setView(item.view)}
                data-testid={`nav-${item.view}`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <ErrorBoundary label={t(`nav.${view === 'rooms' ? 'rooms' : view}`)}>{renderView()}</ErrorBoundary>
        </div>

        {mode === 'beratung' && flowIndex >= 0 && (
          <div className="border-t border-line px-6 py-3 flex items-center justify-between">
            <button className="btn btn-ghost" onClick={goPrev} disabled={flowIndex === 0} data-testid="flow-back">
              <ChevronLeft size={16} /> {t('nav.back')}
            </button>
            <span className="text-xs text-muted">
              {flowIndex + 1} / {FLOW.length}
            </span>
            <button
              className="btn btn-primary"
              onClick={goNext}
              disabled={flowIndex === FLOW.length - 1}
              data-testid="flow-next"
            >
              {t('nav.next')} <ChevronRight size={16} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
