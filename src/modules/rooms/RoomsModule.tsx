import { lazy, Suspense, useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { useT } from '../../hooks';
import { PageHeader, EmptyState, Field, Badge } from '../../components/ui';
import { MiniPlan } from '../../components/MiniPlan';
import { getRoom, getActiveVariant } from '../roomHelpers';
import { RealisticPlan } from '../../components/RealisticPlan';
// three.js wird erst geladen, wenn die 3D-Ansicht geöffnet wird (Code-Splitting).
const Room3D = lazy(() => import('../../components/Room3D').then((m) => ({ default: m.Room3D })));
import { createRoom } from '../../lib/factory';
import { uid } from '../../lib/id';
import { deriveAreas, rectanglePoints, lShapePoints, wallLengthCm, CM_PER_M } from '../../lib/geometry';
import { parseLocaleNumber, formatArea, formatLength } from '../../lib/format';
import {
  validateRoomHeight,
  validateOpening,
  LIMITS,
} from '../../lib/validation';
import type { RoomType, Opening, Floorplan, DoorType, WindowType } from '../../types';
import { Plus, Copy, Trash2, Undo2, Redo2, X, FlipHorizontal2, ArrowLeftRight } from 'lucide-react';

const ROOM_TYPES: RoomType[] = [
  'wohnzimmer', 'esszimmer', 'schlafzimmer', 'kueche', 'bad',
  'arbeitszimmer', 'flur', 'kinderzimmer', 'ankleide', 'aussen',
];

interface Snapshot {
  floorplan: Floorplan;
  heightCm: number;
}

export function RoomsModule({
  activeRoomId,
  onSelectRoom,
  onContinue,
}: {
  activeRoomId: string | null;
  onSelectRoom: (id: string) => void;
  onContinue: () => void;
}) {
  const t = useT();
  const project = useStore((s) => s.project)!;
  const updateProject = useStore((s) => s.updateProject);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<RoomType>('wohnzimmer');

  const room = getRoom(project, activeRoomId);

  // Undo/Redo-Historie pro Editorsitzung.
  const history = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const [, forceTick] = useState(0);

  const snapshot = (): Snapshot | undefined =>
    room ? { floorplan: JSON.parse(JSON.stringify(room.floorplan)), heightCm: room.heightCm } : undefined;

  const commit = (fn: (fp: Floorplan, setHeight: (h: number) => void) => void) => {
    const snap = snapshot();
    if (snap) {
      history.current.push(snap);
      if (history.current.length > 30) history.current.shift();
      future.current = [];
    }
    updateProject((p) => {
      const r = p.rooms.find((x) => x.id === activeRoomId);
      if (!r) return;
      fn(r.floorplan, (h) => (r.heightCm = h));
    });
    forceTick((n) => n + 1);
  };

  const undo = () => {
    const snap = history.current.pop();
    if (!snap || !room) return;
    future.current.push(snapshot()!);
    updateProject((p) => {
      const r = p.rooms.find((x) => x.id === activeRoomId);
      if (!r) return;
      r.floorplan = snap.floorplan;
      r.heightCm = snap.heightCm;
    });
    forceTick((n) => n + 1);
  };
  const redo = () => {
    const snap = future.current.pop();
    if (!snap) return;
    history.current.push(snapshot()!);
    updateProject((p) => {
      const r = p.rooms.find((x) => x.id === activeRoomId);
      if (!r) return;
      r.floorplan = snap.floorplan;
      r.heightCm = snap.heightCm;
    });
    forceTick((n) => n + 1);
  };

  const addRoom = () => {
    const name = newName.trim() || t(`roomType.${newType}`);
    const r = createRoom(name, newType);
    updateProject((p) => p.rooms.push(r));
    onSelectRoom(r.id);
    setNewName('');
  };

  const duplicateRoom = (id: string) => {
    const src = project.rooms.find((r) => r.id === id);
    if (!src) return;
    const copy = JSON.parse(JSON.stringify(src)) as typeof src;
    copy.id = uid('room');
    copy.name = `${src.name} (Kopie)`;
    copy.variants = copy.variants.map((v) => ({ ...v, id: uid('var') }));
    copy.activeVariantId = copy.variants[0].id;
    updateProject((p) => p.rooms.push(copy));
  };

  const deleteRoom = (id: string) => {
    updateProject((p) => {
      p.rooms = p.rooms.filter((r) => r.id !== id);
    });
  };

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        eyebrow={t('app.subtitle')}
        title={t('rooms.title')}
        action={
          project.rooms.length > 0 && room ? (
            <button className="btn btn-primary" onClick={onContinue} data-testid="rooms-continue">
              {t('nav.next')}
            </button>
          ) : undefined
        }
      />

      {/* Raum hinzufügen */}
      <div className="card p-4 mb-6 flex gap-3 flex-wrap items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="field-label">{t('rooms.name')}</label>
          <input className="field-input" value={newName} onChange={(e) => setNewName(e.target.value)} data-testid="new-room-name" />
        </div>
        <div className="min-w-[160px]">
          <label className="field-label">{t('rooms.type')}</label>
          <select className="field-input" value={newType} onChange={(e) => setNewType(e.target.value as RoomType)} data-testid="new-room-type">
            {ROOM_TYPES.map((rt) => (
              <option key={rt} value={rt}>
                {t(`roomType.${rt}`)}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={addRoom} data-testid="add-room">
          <Plus size={16} /> {t('rooms.add')}
        </button>
      </div>

      {project.rooms.length === 0 ? (
        <EmptyState title={t('rooms.empty')} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {project.rooms.map((r) => {
            const d = deriveAreas(r.floorplan, r.heightCm);
            return (
              <div
                key={r.id}
                className={`card p-3 text-left transition-colors cursor-pointer ${r.id === activeRoomId ? 'border-gold' : 'hover:border-gold/40'}`}
                onClick={() => onSelectRoom(r.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSelectRoom(r.id)}
                data-testid="room-card"
              >
                <div className="bg-board rounded mb-2 overflow-hidden">
                  <MiniPlan plan={r.floorplan} height={120} />
                </div>
                <p className="text-sm truncate">{r.name}</p>
                <p className="text-muted text-xs">{formatArea(d.floorAreaM2)}</p>
                <div className="flex gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                  <button className="btn btn-ghost px-2 py-1" onClick={() => duplicateRoom(r.id)} title={t('rooms.duplicate')}>
                    <Copy size={13} />
                  </button>
                  <button className="btn btn-danger px-2 py-1" onClick={() => deleteRoom(r.id)} title={t('common.delete')}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {room && <RoomEditor roomId={room.id} commit={commit} undo={undo} redo={redo} canUndo={history.current.length > 0} canRedo={future.current.length > 0} />}
    </div>
  );
}

function RoomEditor({
  roomId,
  commit,
  undo,
  redo,
  canUndo,
  canRedo,
}: {
  roomId: string;
  commit: (fn: (fp: Floorplan, setHeight: (h: number) => void) => void) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}) {
  const t = useT();
  const project = useStore((s) => s.project)!;
  const updateProject = useStore((s) => s.updateProject);
  const room = getRoom(project, roomId)!;
  const d = deriveAreas(room.floorplan, room.heightCm);

  const [widthStr, setWidthStr] = useState(((Math.max(...room.floorplan.points.map((p) => p.x)) - Math.min(...room.floorplan.points.map((p) => p.x))) / CM_PER_M).toFixed(2));
  const [depthStr, setDepthStr] = useState(((Math.max(...room.floorplan.points.map((p) => p.y)) - Math.min(...room.floorplan.points.map((p) => p.y))) / CM_PER_M).toFixed(2));
  const [heightStr, setHeightStr] = useState((room.heightCm / CM_PER_M).toFixed(2));
  const [heightErr, setHeightErr] = useState<string | undefined>();
  const [planView, setPlanView] = useState<'technisch' | 'realistisch' | 'dreidimensional'>('technisch');
  const [showCeiling, setShowCeiling] = useState(false);
  // Erweiterung 6 · S12: Tageslicht-Stimmung + Still-Render-Zugriff.
  const [daylight, setDaylight] = useState(false);
  const room3dApi = useRef<import('../../components/Room3D').Room3DApi | null>(null);

  const applyRectangle = () => {
    const w = parseLocaleNumber(widthStr);
    const dp = parseLocaleNumber(depthStr);
    if (!Number.isFinite(w) || !Number.isFinite(dp)) return;
    if (w * CM_PER_M < LIMITS.wallCmMin || dp * CM_PER_M < LIMITS.wallCmMin) return;
    commit((fp) => {
      fp.points = rectanglePoints(Math.round(w * CM_PER_M), Math.round(dp * CM_PER_M));
      fp.openings = fp.openings.filter((o) => o.wallIndex < 4);
    });
  };

  const applyLShape = () => {
    const w = parseLocaleNumber(widthStr);
    const dp = parseLocaleNumber(depthStr);
    if (!Number.isFinite(w) || !Number.isFinite(dp)) return;
    commit((fp) => {
      const notch = Math.round(Math.min(w, dp) * CM_PER_M * 0.4);
      fp.points = lShapePoints(Math.round(w * CM_PER_M), Math.round(dp * CM_PER_M), notch);
      fp.openings = [];
    });
  };

  const applyHeight = () => {
    const h = parseLocaleNumber(heightStr);
    const res = validateRoomHeight(h * CM_PER_M);
    if (!res.ok) {
      setHeightErr(t(res.issue.code, res.issue.params));
      return;
    }
    setHeightErr(undefined);
    commit((_fp, setHeight) => setHeight(Math.round(h * CM_PER_M)));
  };

  const addOpening = (kind: 'fenster' | 'tuer' | 'durchbruch') => {
    commit((fp) => {
      const wall = 0;
      const op: Opening = {
        id: uid('op'),
        kind,
        wallIndex: wall,
        offsetCm: 30,
        widthCm: kind === 'tuer' ? 88.5 : kind === 'durchbruch' ? 150 : 120,
        heightCm: kind === 'fenster' ? 140 : kind === 'durchbruch' ? 220 : 200,
        sillCm: kind === 'fenster' ? 90 : 0,
      };
      fp.openings.push(op);
    });
  };

  const wallCount = room.floorplan.points.length;
  const variant = getActiveVariant(room);

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6" data-testid="room-editor">
      {/* Plan + Maßstab */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1" data-testid="plan-view-toggle">
            <button
              className={`px-2.5 py-1 text-xs border rounded ${planView === 'technisch' ? 'border-gold text-gold' : 'border-line text-muted'}`}
              onClick={() => setPlanView('technisch')}
              data-testid="plan-technisch"
            >
              {t('plan.technical')}
            </button>
            <button
              className={`px-2.5 py-1 text-xs border rounded ${planView === 'realistisch' ? 'border-gold text-gold' : 'border-line text-muted'}`}
              onClick={() => setPlanView('realistisch')}
              data-testid="plan-realistisch"
            >
              {t('plan.realistic')}
            </button>
            <button
              className={`px-2.5 py-1 text-xs border rounded ${planView === 'dreidimensional' ? 'border-gold text-gold' : 'border-line text-muted'}`}
              onClick={() => setPlanView('dreidimensional')}
              data-testid="plan-3d"
            >
              {t('plan.threeD')}
            </button>
            {planView === 'dreidimensional' && (
              <>
                <button
                  className={`px-2.5 py-1 text-xs border rounded ${showCeiling ? 'border-gold text-gold' : 'border-line text-muted'}`}
                  onClick={() => setShowCeiling((v) => !v)}
                  data-testid="plan-ceiling"
                >
                  {t('plan.ceiling')}
                </button>
                {/* Erweiterung 6 · S12: Tageslicht + Still-Render */}
                <button
                  className={`px-2.5 py-1 text-xs border rounded ${daylight ? 'border-gold text-gold' : 'border-line text-muted'}`}
                  onClick={() => setDaylight((v) => !v)}
                  data-testid="plan-daylight"
                >
                  {t('plan.daylight')}
                </button>
                <button
                  className="px-2.5 py-1 text-xs border rounded border-line text-muted hover:text-text"
                  onClick={() => {
                    const url = room3dApi.current?.snapshot();
                    if (!url) return;
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `haven-still-${room.name.replace(/\s+/g, '_')}.png`;
                    a.click();
                  }}
                  data-testid="plan-still"
                >
                  {t('plan.still')}
                </button>
              </>
            )}
          </div>
          <span className="eyebrow">{t('rooms.title')}</span>
          <div className="flex gap-1">
            <button className="btn btn-ghost px-2 py-1" onClick={undo} disabled={!canUndo} title={t('rooms.undo')} data-testid="undo">
              <Undo2 size={14} />
            </button>
            <button className="btn btn-ghost px-2 py-1" onClick={redo} disabled={!canRedo} title={t('rooms.redo')} data-testid="redo">
              <Redo2 size={14} />
            </button>
          </div>
        </div>
        <div className="board-surface rounded p-3">
          {planView === 'dreidimensional' && variant ? (
            <Suspense fallback={<div style={{ width: 560, height: 360 }} className="flex items-center justify-center text-[#6b6256] text-sm">3D…</div>}>
              <Room3D room={room} variant={variant} width={560} height={360} showCeiling={showCeiling} daylight={daylight} apiRef={room3dApi} />
            </Suspense>
          ) : planView === 'realistisch' && variant ? (
            <RealisticPlan room={room} variant={variant} width={560} height={360} showDimensions />
          ) : (
            <MiniPlan plan={room.floorplan} heightCm={room.heightCm} width={560} height={360} showDimensions />
          )}
          <div className="flex items-center gap-2 mt-2 text-[#6b6256] text-xs">
            {planView === 'dreidimensional' ? (
              <span>{t('plan.orbitHint')}</span>
            ) : (
              <>
                <div className="h-px bg-[#1A1814] w-12" />
                <span>1,00 m</span>
              </>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-center">
          <Derived label={t('rooms.floorArea')} value={formatArea(d.floorAreaM2)} testid="area-floor" />
          <Derived label={t('rooms.perimeter')} value={formatLength(d.perimeterM)} testid="area-perimeter" />
          <Derived label={t('rooms.wallArea')} value={formatArea(d.netWallAreaM2)} testid="area-wall" />
          <Derived label={t('rooms.ceilingArea')} value={formatArea(d.ceilingAreaM2)} testid="area-ceiling" />
        </div>
      </div>

      {/* Eingaben */}
      <div className="space-y-4">
        <div className="card p-4 space-y-3">
          <Field label={t('rooms.name')}>
            <input
              className="field-input"
              value={room.name}
              onChange={(e) => updateProject((p) => { const r = p.rooms.find((x) => x.id === roomId); if (r) r.name = e.target.value; })}
              data-testid="room-name"
            />
          </Field>
          <Field label={t('rooms.type')}>
            <select
              className="field-input"
              value={room.type}
              onChange={(e) => updateProject((p) => { const r = p.rooms.find((x) => x.id === roomId); if (r) r.type = e.target.value as RoomType; })}
            >
              {ROOM_TYPES.map((rt) => (
                <option key={rt} value={rt}>{t(`roomType.${rt}`)}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`${t('rooms.width')} (m)`}>
              <input className="field-input" value={widthStr} onChange={(e) => setWidthStr(e.target.value)} onBlur={applyRectangle} data-testid="room-width" inputMode="decimal" />
            </Field>
            <Field label={`${t('rooms.depth')} (m)`}>
              <input className="field-input" value={depthStr} onChange={(e) => setDepthStr(e.target.value)} onBlur={applyRectangle} data-testid="room-depth" inputMode="decimal" />
            </Field>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost flex-1" onClick={applyRectangle} data-testid="shape-rect">{t('rooms.rectangle')}</button>
            <button className="btn btn-ghost flex-1" onClick={applyLShape} data-testid="shape-l">{t('rooms.lshape')}</button>
          </div>
          <Field label={`${t('rooms.height')} (m)`} error={heightErr}>
            <input className="field-input" value={heightStr} onChange={(e) => setHeightStr(e.target.value)} onBlur={applyHeight} data-testid="room-height" inputMode="decimal" />
          </Field>
        </div>

        {/* Öffnungen */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="eyebrow">{t('rooms.openings')}</span>
            <div className="flex gap-1">
              <button className="btn btn-ghost px-3 py-1.5 text-xs" onClick={() => addOpening('fenster')} data-testid="add-window">
                <Plus size={13} /> {t('rooms.addWindow')}
              </button>
              <button className="btn btn-ghost px-3 py-1.5 text-xs" onClick={() => addOpening('tuer')} data-testid="add-door">
                <Plus size={13} /> {t('rooms.addDoor')}
              </button>
              <button className="btn btn-ghost px-3 py-1.5 text-xs" onClick={() => addOpening('durchbruch')} data-testid="add-passage">
                <Plus size={13} /> {t('rooms.addPassage')}
              </button>
            </div>
          </div>
          <div className="space-y-3" data-testid="openings-list">
            {room.floorplan.openings.length === 0 && <p className="text-muted text-sm">{t('empty.generic')}</p>}
            {room.floorplan.openings.map((o) => (
              <OpeningRow key={o.id} roomId={roomId} openingId={o.id} commit={commit} wallCount={wallCount} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Derived({ label, value, testid }: { label: string; value: string; testid: string }) {
  return (
    <div>
      <p className="text-muted text-[10px] uppercase tracking-wider">{label}</p>
      <p className="text-lg" data-testid={testid}>{value}</p>
    </div>
  );
}

function OpeningRow({
  roomId,
  openingId,
  commit,
  wallCount,
}: {
  roomId: string;
  openingId: string;
  commit: (fn: (fp: Floorplan, setHeight: (h: number) => void) => void) => void;
  wallCount: number;
}) {
  const t = useT();
  const project = useStore((s) => s.project)!;
  const room = getRoom(project, roomId)!;
  const o = room.floorplan.openings.find((x) => x.id === openingId)!;
  const validation = validateOpening(room.floorplan, room.heightCm, openingId);
  const err = validation.ok ? undefined : t(validation.issue.code, validation.issue.params);
  const wallLenM = (wallLengthCm(room.floorplan.points, o.wallIndex) / CM_PER_M).toFixed(2);

  const setField = (field: 'wallIndex' | 'offsetCm' | 'widthCm' | 'heightCm' | 'sillCm', raw: string) => {
    const num = parseLocaleNumber(raw);
    if (!Number.isFinite(num)) return;
    commit((fp) => {
      const op = fp.openings.find((x) => x.id === openingId);
      if (!op) return;
      if (field === 'wallIndex') op.wallIndex = Math.max(0, Math.min(wallCount - 1, Math.round(num)));
      else op[field] = Math.round(num * CM_PER_M);
    });
  };

  const remove = () =>
    commit((fp) => {
      fp.openings = fp.openings.filter((x) => x.id !== openingId);
    });

  // Erweiterung 7 · W1/W3: Typ, Anschlag, Öffnungsrichtung, Flügel, Sprossen, Schnellmaße.
  const setOpening = (fn: (op: Opening) => void) =>
    commit((fp) => {
      const op = fp.openings.find((x) => x.id === openingId);
      if (op) fn(op);
    });
  const DOOR_TYPES: DoorType[] = ['dreh', 'schiebe', 'doppel', 'durchgang', 'pocket', 'falt'];
  const WINDOW_TYPES: WindowType[] = ['dreh-kipp', 'fest', 'schiebe', 'bodentief'];
  const doorWidths = [76, 88.5, 101];
  const windowWidths = [60, 100, 120, 180];
  const sillQuick = [0, 60, 85, 90, 110];
  const swings = (o.kind === 'tuer' && (o.doorType ?? 'dreh') === 'dreh') || (o.doorType ?? 'dreh') === 'doppel';

  return (
    <div className={`border rounded p-3 ${err ? 'border-danger/50' : 'border-line'}`} data-testid="opening-row">
      <div className="flex items-center justify-between mb-2">
        <Badge tone={o.kind === 'fenster' ? 'gold' : 'muted'}>
          {o.kind === 'fenster' ? t('rooms.addWindow') : o.kind === 'durchbruch' ? t('rooms.addPassage') : t('rooms.addDoor')}
        </Badge>
        <button className="text-muted hover:text-danger" onClick={remove} aria-label={t('common.delete')}>
          <X size={15} />
        </button>
      </div>

      {o.kind === 'tuer' && (
        <div className="mb-2 space-y-2">
          <select
            className="field-input text-xs"
            value={o.doorType ?? 'dreh'}
            onChange={(e) => setOpening((op) => { op.doorType = e.target.value as DoorType; })}
            data-testid="door-type"
          >
            {DOOR_TYPES.map((dt) => (
              <option key={dt} value={dt}>{t(`doorType.${dt}`)}</option>
            ))}
          </select>
          <div className="flex flex-wrap gap-1.5">
            <button
              className="px-2 py-1 text-[11px] border border-line rounded text-muted hover:text-text inline-flex items-center gap-1"
              onClick={() => setOpening((op) => { op.hinge = (op.hinge ?? 'links') === 'links' ? 'rechts' : 'links'; })}
              data-testid="opening-mirror"
            >
              <FlipHorizontal2 size={11} /> {t('opening.mirror')} ({t(`opening.hinge.${o.hinge ?? 'links'}`)})
            </button>
            {swings && (
              <button
                className="px-2 py-1 text-[11px] border border-line rounded text-muted hover:text-text inline-flex items-center gap-1"
                onClick={() => setOpening((op) => { op.opensInward = !(op.opensInward ?? true); })}
                data-testid="opening-inout"
              >
                <ArrowLeftRight size={11} /> {(o.opensInward ?? true) ? t('opening.opensInward') : t('opening.opensOutward')}
              </button>
            )}
            {doorWidths.map((wcm) => (
              <button
                key={wcm}
                className={`px-2 py-1 text-[11px] border rounded ${Math.abs(o.widthCm - wcm) < 0.5 ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
                onClick={() => setOpening((op) => { op.widthCm = wcm; })}
                data-testid={`door-width-${wcm}`}
              >
                {(wcm / CM_PER_M).toLocaleString('de-DE', { minimumFractionDigits: 2 })} m
              </button>
            ))}
          </div>
        </div>
      )}

      {o.kind === 'fenster' && (
        <div className="mb-2 space-y-2">
          <select
            className="field-input text-xs"
            value={o.windowType ?? 'dreh-kipp'}
            onChange={(e) => setOpening((op) => {
              op.windowType = e.target.value as WindowType;
              if (e.target.value === 'bodentief') op.sillCm = 0;
            })}
            data-testid="window-type"
          >
            {WINDOW_TYPES.map((wt) => (
              <option key={wt} value={wt}>{t(`windowType.${wt}`)}</option>
            ))}
          </select>
          <div className="flex flex-wrap gap-1.5 items-center">
            <button
              className="px-2 py-1 text-[11px] border border-line rounded text-muted hover:text-text inline-flex items-center gap-1"
              onClick={() => setOpening((op) => { op.hinge = (op.hinge ?? 'links') === 'links' ? 'rechts' : 'links'; })}
              data-testid="window-mirror"
            >
              <FlipHorizontal2 size={11} /> {t('opening.mirror')} ({t(`opening.hinge.${o.hinge ?? 'links'}`)})
            </button>
            <span className="text-muted text-[10px]">{t('opening.wings')}:</span>
            {([1, 2, 3] as const).map((n) => (
              <button
                key={n}
                className={`px-2 py-1 text-[11px] border rounded ${(o.wings ?? 1) === n ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
                onClick={() => setOpening((op) => { op.wings = n; })}
                data-testid={`window-wings-${n}`}
              >
                {n}
              </button>
            ))}
            <button
              className={`px-2 py-1 text-[11px] border rounded ${o.muntins ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
              onClick={() => setOpening((op) => { op.muntins = !op.muntins; })}
              data-testid="window-muntins"
            >
              {t('opening.muntins')}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-muted text-[10px]">{t('opening.sill')}:</span>
            {sillQuick.map((s) => (
              <button
                key={s}
                className={`px-2 py-1 text-[11px] border rounded ${o.sillCm === s ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
                onClick={() => setOpening((op) => {
                  op.sillCm = s;
                  if (s === 0) op.windowType = 'bodentief';
                })}
                data-testid={`window-sill-${s}`}
              >
                {s} cm
              </button>
            ))}
            {windowWidths.map((wcm) => (
              <button
                key={wcm}
                className={`px-2 py-1 text-[11px] border rounded ${Math.abs(o.widthCm - wcm) < 0.5 ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
                onClick={() => setOpening((op) => { op.widthCm = wcm; })}
                data-testid={`window-width-${wcm}`}
              >
                B {(wcm / CM_PER_M).toLocaleString('de-DE', { minimumFractionDigits: 2 })} m
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <label>
          <span className="text-muted">{t('rooms.wall')} (0–{wallCount - 1}, {wallLenM} m)</span>
          <input className="field-input mt-1" defaultValue={o.wallIndex} onBlur={(e) => setField('wallIndex', e.target.value)} data-testid="opening-wall" />
        </label>
        <label>
          <span className="text-muted">{t('rooms.width')} (m)</span>
          <input className="field-input mt-1" defaultValue={(o.widthCm / CM_PER_M).toFixed(2)} onBlur={(e) => setField('widthCm', e.target.value)} data-testid="opening-width" />
        </label>
        <label>
          <span className="text-muted">{t('rooms.height')} (m)</span>
          <input className="field-input mt-1" defaultValue={(o.heightCm / CM_PER_M).toFixed(2)} onBlur={(e) => setField('heightCm', e.target.value)} data-testid="opening-height" />
        </label>
        <label>
          <span className="text-muted">{t('rooms.offset')} (m)</span>
          <input className="field-input mt-1" defaultValue={(o.offsetCm / CM_PER_M).toFixed(2)} onBlur={(e) => setField('offsetCm', e.target.value)} />
        </label>
      </div>
      {err && (
        <p className="field-error mt-2" role="alert" data-testid="opening-error">
          {err}
        </p>
      )}
    </div>
  );
}
