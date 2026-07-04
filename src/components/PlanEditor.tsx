/**
 * HAVEN ATELIER — Interaktiver Grundriss-Editor (Erweiterung 7 · W2).
 * Türen/Fenster/Durchbrüche mit der Maus GEDRÜCKT entlang ihrer Wand ziehen
 * (magnetisch auf der Wandachse), Live-Eckmaße, Einrasten (Wandmitte/10 cm,
 * Alt = 1 cm fein), Wand-Wechsel mit Vorschau, klickbare Maßzahlen mit exakter
 * Eingabe, Duplizieren, Touch per Long-Press. Rein additiv: nur die Ansicht
 * „Technisch" im Raum-Editor nutzt diese Komponente — MiniPlan bleibt überall
 * sonst unverändert.
 */
import { useRef, useState } from 'react';
import type { Floorplan, InnerWall, Opening, Point, Room, WallType } from '../types';
import { CM_PER_M, wallLengthCm } from '../lib/geometry';
import { openingSymbol, inwardNormal } from '../lib/planSymbols';
import {
  dragOpeningTo,
  wallSwitchCandidate,
  cornerDistances,
  offsetFromCorner,
  clampOpeningOffset,
  projectOntoWall,
  pointOnWall,
  snapWallPoint,
  snapWallDirection,
  exactLengthPoint,
  pointOnBoundary,
  splitPolygon,
  splitWallAt,
  deleteWall,
  openingsOnWallPair,
  polygonCentroid,
  snapMeasurePoint,
} from '../lib/planEditor';
import { deriveAreas } from '../lib/geometry';
import { useStore } from '../store/useStore';
import { useT } from '../hooks';
import { uid } from '../lib/id';
import { Copy, X, MousePointer2, PenLine, Ruler, Armchair, Zap, Flame, MapPin } from 'lucide-react';
import { ObjectLayer, placeObjectAt } from './ObjectLayer';
import { FURNITURE_TYPES, findFurnitureType } from '../data/furniture';
import { electroSymbol } from '../lib/electroSymbols';
import { footprintAreaM2 } from '../lib/objects';
import { compressImage } from '../lib/image';
import { checkWayfinding } from '../lib/wayfinding';
import { ELECTRO_LABELS } from '../lib/projectCost';
import type { PlacedObject, ElectroItem, ElectroKind, PlanPin, PinCategory } from '../types';

const PAD = 30;
const WALL_THICKNESSES = [11.5, 17.5, 24, 36.5];
const ELECTRO_KINDS: ElectroKind[] = ['steckdose1', 'steckdose2', 'steckdose3', 'schalter', 'wechsel', 'doppel', 'deckenauslass', 'wandauslass', 'netzwerk', 'tv', 'herd'];
const PIN_CATEGORIES: PinCategory[] = ['hinweis', 'frage', 'mangel', 'todo'];
const PIN_COLORS: Record<PinCategory, string> = { hinweis: '#C9A84C', frage: '#5A7488', mangel: '#C8553D', todo: '#6B8F71' };

type Tool = 'select' | 'wall' | 'measure' | 'electro' | 'heat' | 'pin';

interface SessionMeasure {
  id: string;
  a: Point;
  b: Point;
}

interface DragState {
  id: string;
  wallIndex: number;
  offsetCm: number;
  /** Touch: Drag erst nach Long-Press aktiv. */
  active: boolean;
  timer?: ReturnType<typeof setTimeout>;
}

export function PlanEditor({
  room,
  commit,
  width = 560,
  height = 360,
  onSplitRoom,
  projectDismissed = [],
  onDismissHint,
}: {
  room: Room;
  commit: (fn: (fp: Floorplan, setHeight: (h: number) => void, room: Room) => void) => void;
  width?: number;
  height?: number;
  /** W4: Raum durch die neue Wand in zwei Räume teilen (Projekt-Ebene). */
  onSplitRoom?: (polyA: Point[], polyB: Point[], wall: InnerWall) => void;
  /** T5: projektweit ignorierte Hinweis-Schlüssel. */
  projectDismissed?: string[];
  /** T5: Hinweis ignorieren (auf Projekt-Ebene merken). */
  onDismissHint?: (key: string) => void;
}) {
  const t = useT();
  // Interne Ebenen (Pins) nur im Expertenmodus — Kunden-/Präsentationsmodus NIE.
  const mode = useStore((s) => s.mode);
  const internalAllowed = mode === 'experte';
  const plan = room.floorplan;
  const pts = plan.points;
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<DragState | null>(null);
  const [, tick] = useState(0);
  const rerender = () => tick((n) => n + 1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [switchPreview, setSwitchPreview] = useState<number | null>(null);
  const [editing, setEditing] = useState<{ side: 'links' | 'rechts'; value: string } | null>(null);
  const [placing, setPlacing] = useState<Opening | null>(null);
  const [ghost, setGhost] = useState<{ wallIndex: number; offsetCm: number } | null>(null);
  // ── W4: Wand-Werkzeug ──
  const [tool, setTool] = useState<Tool>('select');
  const [wallStart, setWallStart] = useState<Point | null>(null);
  const [wallCursor, setWallCursor] = useState<Point | null>(null);
  const [lenBuf, setLenBuf] = useState('');
  const [splitAsk, setSplitAsk] = useState<InnerWall | null>(null);
  /** Ausgewählte Wand: Umriss-Index ODER Innenwand-ID. */
  const [selWall, setSelWall] = useState<number | string | null>(null);
  // ── W5: Wand teilen / löschen ──
  const [splittingWall, setSplittingWall] = useState<number | null>(null);
  const [deleteAsk, setDeleteAsk] = useState<number | null>(null);
  // ── W6: Messwerkzeug + Raum-Etikett ──
  const [measureStart, setMeasureStart] = useState<Point | null>(null);
  const [measureCursor, setMeasureCursor] = useState<Point | null>(null);
  const [sessionMeasures, setSessionMeasures] = useState<SessionMeasure[]>([]);
  const [renaming, setRenaming] = useState<string | null>(null);
  // ── W7: Nordpfeil, Raster, Lineale ──
  const [showGrid, setShowGrid] = useState(false);
  const [gridStep, setGridStep] = useState(50); // cm
  const [showRulers, setShowRulers] = useState(false);
  const [northEdit, setNorthEdit] = useState(false);
  const [cursorPos, setCursorPos] = useState<Point | null>(null);
  const northDrag = useRef(false);
  const [northLive, setNorthLive] = useState<number | null>(null);
  // ── Erweiterung 8 · T1/T2: Einrichtung ──
  const [objSelId, setObjSelId] = useState<string | null>(null);
  const [showObjDims, setShowObjDims] = useState(false);
  const [placingTypeId, setPlacingTypeId] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [polyDraw, setPolyDraw] = useState<Point[] | null>(null);
  // ── Erweiterung 8 · T3/T4/T6: Elektro, Heizzonen, Pins ──
  const [electroKind, setElectroKind] = useState<ElectroKind>('steckdose2');
  const [heatDraw, setHeatDraw] = useState<Point[] | null>(null);
  const [pinCat, setPinCat] = useState<PinCategory>('hinweis');
  const [pinEdit, setPinEdit] = useState<string | null>(null);
  // Hinweise: im Beratungsmodus standardmäßig AUS; Präsentationsmodus zeigt sie NIE.
  const [layers, setLayers] = useState({ electro: true, heat: true, pins: true, hints: mode === 'experte' });
  // ── W8: Onboarding + Kürzel-Übersicht (einmalig, überspringbar) ──
  const [showHelp, setShowHelp] = useState<boolean>(() => {
    try {
      return localStorage.getItem('haven.editorOnboarding7') === null;
    } catch {
      return false;
    }
  });
  const dismissHelp = () => {
    try {
      localStorage.setItem('haven.editorOnboarding7', '1');
    } catch {
      /* Sitzung ohne Speicher */
    }
    setShowHelp(false);
  };

  if (pts.length < 3) return null;

  // ── Weltkoordinaten (cm) ↔ Bildschirm ──
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const spanX = Math.max(1, Math.max(...xs) - minX);
  const spanY = Math.max(1, Math.max(...ys) - minY);
  const scale = Math.min((width - PAD * 2) / spanX, (height - PAD * 2) / spanY);
  const ox = PAD + (width - PAD * 2 - spanX * scale) / 2;
  const oy = PAD + (height - PAD * 2 - spanY * scale) / 2;
  const tx = (x: number) => ox + (x - minX) * scale;
  const ty = (y: number) => oy + (y - minY) * scale;
  const toWorld = (e: { clientX: number; clientY: number }): Point => {
    const rect = svgRef.current!.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * width;
    const sy = ((e.clientY - rect.top) / rect.height) * height;
    return { x: minX + (sx - ox) / scale, y: minY + (sy - oy) / scale };
  };

  const setOpening = (id: string, fn: (o: Opening) => void) =>
    commit((fp) => {
      const o = fp.openings.find((x) => x.id === id);
      if (o) fn(o);
    });

  // ── W4: Wand zeichnen ──
  const wallSnapCursor = (raw: Point, freeAngle: boolean): Point => {
    if (!wallStart) return snapWallPoint(pts, plan.innerWalls, raw);
    const dir = snapWallDirection(wallStart, raw, freeAngle);
    // Harte Fangpunkte (Ecken/Endpunkte) dürfen den Winkel brechen:
    const hard = snapWallPoint(pts, plan.innerWalls, raw, 10, 12);
    const hardIsCorner =
      pts.some((c) => c.x === hard.x && c.y === hard.y) ||
      (plan.innerWalls ?? []).some((w) => (w.a.x === hard.x && w.a.y === hard.y) || (w.b.x === hard.x && w.b.y === hard.y));
    if (hardIsCorner && Math.hypot(hard.x - raw.x, hard.y - raw.y) <= 12) return hard;
    // sonst: Richtung halten, Länge auf 5 cm runden
    const len = Math.round(Math.hypot(dir.x - wallStart.x, dir.y - wallStart.y) / 5) * 5;
    return exactLengthPoint(wallStart, dir, len);
  };

  const commitWall = (end: Point) => {
    if (!wallStart) return;
    if (Math.hypot(end.x - wallStart.x, end.y - wallStart.y) < 20) return;
    const wall: InnerWall = { id: uid('iw'), a: wallStart, b: end, thicknessCm: 11.5, wallType: 'trockenbau' };
    const onA = pointOnBoundary(pts, wall.a, 3);
    const onB = pointOnBoundary(pts, wall.b, 3);
    const crosses = onA && onB && onA.wallIndex !== onB.wallIndex && splitPolygon(pts, wall.a, wall.b) !== null;
    if (crosses && onSplitRoom) {
      setSplitAsk(wall);
      setWallStart(null);
    } else {
      commit((fp) => {
        fp.innerWalls = [...(fp.innerWalls ?? []), wall];
      });
      setWallStart(end); // Kettenmodus
    }
    setLenBuf('');
  };

  const wallToolClick = (e: React.PointerEvent) => {
    const raw = toWorld(e);
    if (!wallStart) {
      const p = snapWallPoint(pts, plan.innerWalls, raw);
      setWallStart(p);
      setWallCursor(p);
    } else {
      commitWall(wallSnapCursor(raw, e.shiftKey));
    }
  };

  // ── Drag-Handler ──
  const startDrag = (e: React.PointerEvent, o: Opening) => {
    e.stopPropagation();
    setSelectedId(o.id);
    setEditing(null);
    const st: DragState = { id: o.id, wallIndex: o.wallIndex, offsetCm: o.offsetCm, active: e.pointerType !== 'touch' };
    if (e.pointerType === 'touch') {
      st.timer = setTimeout(() => {
        st.active = true;
        rerender();
      }, 300);
    }
    drag.current = st;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };

  const moveDrag = (e: React.PointerEvent) => {
    const st = drag.current;
    setCursorPos(toWorld(e));
    // W7: Nordpfeil per Drag drehen
    if (northDrag.current) {
      const rect = svgRef.current!.getBoundingClientRect();
      const cx = rect.left + (rect.width * (width - 34)) / width;
      const cy = rect.top + (rect.height * 34) / height;
      const deg = (Math.atan2(e.clientX - cx, -(e.clientY - cy)) * 180) / Math.PI;
      setNorthLive(((Math.round(deg) % 360) + 360) % 360);
      return;
    }
    if (tool === 'measure') {
      setMeasureCursor(snapMeasurePoint(plan, toWorld(e)));
      return;
    }
    if (tool === 'wall') {
      const raw = toWorld(e);
      setWallCursor(wallStart ? wallSnapCursor(raw, e.shiftKey) : snapWallPoint(pts, plan.innerWalls, raw));
      return;
    }
    if (placing) {
      const w = toWorld(e);
      const cand = nearestWall(pts, w);
      if (cand !== null) {
        const { s } = projectOntoWall(pts, cand, w);
        const off = clampOpeningOffset(plan, cand, placing.widthCm, s - placing.widthCm / 2, placing.id);
        setGhost({ wallIndex: cand, offsetCm: off });
      }
      return;
    }
    if (!st || !st.active) return;
    const w = toWorld(e);
    const cand = wallSwitchCandidate(pts, w, st.wallIndex);
    setSwitchPreview(cand);
    const wall = cand ?? st.wallIndex;
    if (cand !== null) st.wallIndex = cand;
    st.offsetCm = dragOpeningTo(
      { ...plan, openings: plan.openings.map((o) => (o.id === st.id ? { ...o, wallIndex: wall } : o)) },
      st.id,
      wall,
      w,
      e.altKey,
    );
    rerender();
  };

  const endDrag = () => {
    // W7: Nordpfeil-Drehung abschließen (EIN Undo-Schritt)
    if (northDrag.current) {
      northDrag.current = false;
      if (northLive !== null) {
        const deg = northLive;
        commit((fp) => {
          fp.northAngleDeg = deg;
        });
      }
      setNorthLive(null);
      return;
    }
    const st = drag.current;
    drag.current = null;
    setSwitchPreview(null);
    if (!st) return;
    if (st.timer) clearTimeout(st.timer);
    if (!st.active) return;
    setOpening(st.id, (o) => {
      o.wallIndex = st.wallIndex;
      o.offsetCm = st.offsetCm;
    });
  };

  const placeCopy = (e: React.PointerEvent) => {
    if (!placing || !ghost) return;
    e.stopPropagation();
    const copy = { ...placing, wallIndex: ghost.wallIndex, offsetCm: ghost.offsetCm };
    commit((fp) => fp.openings.push(copy));
    setSelectedId(copy.id);
    setPlacing(null);
    setGhost(null);
  };

  const duplicate = () => {
    const src = plan.openings.find((o) => o.id === selectedId);
    if (!src) return;
    setPlacing({ ...JSON.parse(JSON.stringify(src)), id: uid('op') });
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (wallStart) {
        setWallStart(null);
        setLenBuf('');
      } else if (tool === 'wall') {
        setTool('select');
      }
      setPlacing(null);
      setGhost(null);
      setSelectedId(null);
      setEditing(null);
      setSelWall(null);
      setSplittingWall(null);
      setDeleteAsk(null);
      setMeasureStart(null);
      setRenaming(null);
      setObjSelId(null);
      setPlacingTypeId(null);
      setPaletteOpen(false);
      setPolyDraw(null);
      setHeatDraw(null);
      setPinEdit(null);
      if (tool !== 'select') setTool('select');
      return;
    }
    // W4: exakte Längeneingabe während des Ziehens (Ziffern + Enter)
    if (tool === 'wall' && wallStart) {
      if (/^[0-9.,]$/.test(e.key)) {
        setLenBuf((b) => b + e.key);
        return;
      }
      if (e.key === 'Backspace') {
        setLenBuf((b) => b.slice(0, -1));
        return;
      }
      if (e.key === 'Enter' && lenBuf && wallCursor) {
        const v = Number(lenBuf.replace(',', '.'));
        if (Number.isFinite(v) && v > 0) {
          const cm = v <= 20 ? v * CM_PER_M : v; // ≤20 → Meter, sonst cm
          commitWall(exactLengthPoint(wallStart, wallCursor, cm));
        }
        return;
      }
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && objSelId) {
      commit((_fp, _h, r) => {
        const v = r.variants.find((x) => x.id === r.activeVariantId);
        if (v) v.placed = (v.placed ?? []).filter((o) => o.id !== objSelId);
      });
      setObjSelId(null);
      return;
    }
    if ((e.key === 'd' || e.key === 'D') && objSelId) {
      const src = room.variants.find((v) => v.id === room.activeVariantId)?.placed?.find((o) => o.id === objSelId);
      if (src) {
        const copy: PlacedObject = { ...JSON.parse(JSON.stringify(src)), id: uid('po'), x: src.x + 40, y: src.y + 40 };
        commit((_fp, _h, r) => {
          const v = r.variants.find((x) => x.id === r.activeVariantId);
          if (v) v.placed = [...(v.placed ?? []), copy];
        });
        setObjSelId(copy.id);
      }
      return;
    }
    if ((e.key === 'e' || e.key === 'E') && !wallStart) {
      setPaletteOpen((v) => !v);
    } else if ((e.key === 'w' || e.key === 'W') && !wallStart) {
      setTool((tl) => (tl === 'wall' ? 'select' : 'wall'));
    } else if (e.key === 'm' || e.key === 'M') {
      setTool((tl) => (tl === 'measure' ? 'select' : 'measure'));
      setMeasureStart(null);
    } else if ((e.key === 'd' || e.key === 'D') && selectedId) {
      duplicate();
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
      commit((fp) => {
        fp.openings = fp.openings.filter((o) => o.id !== selectedId);
      });
      setSelectedId(null);
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && typeof selWall === 'string') {
      commit((fp) => {
        fp.innerWalls = (fp.innerWalls ?? []).filter((w) => w.id !== selWall);
      });
      setSelWall(null);
    }
  };

  // Live-Werte der gerade gezogenen Öffnung einblenden
  const liveOpening = (o: Opening): Opening =>
    drag.current && drag.current.active && drag.current.id === o.id
      ? { ...o, wallIndex: drag.current.wallIndex, offsetCm: drag.current.offsetCm }
      : o;

  const selected = plan.openings.find((o) => o.id === selectedId);
  const poly = pts.map((p) => `${tx(p.x)},${ty(p.y)}`).join(' ');

  return (
    <div className="relative" tabIndex={0} onKeyDown={onKey} data-testid="plan-editor">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        className="block select-none touch-none"
        onPointerMove={moveDrag}
        onPointerUp={placing ? placeCopy : endDrag}
        onPointerLeave={endDrag}
        onPointerDown={(e) => {
          // Erweiterung 8: Objekt platzieren / Sonderform zeichnen
          if (placingTypeId) {
            const at = toWorld(e);
            const id = uid('po');
            const obj = placeObjectAt(placingTypeId, at, id);
            if (obj) {
              commit((_fp, _h, r) => {
                const v = r.variants.find((x) => x.id === r.activeVariantId);
                if (!v) return;
                v.placed = [...(v.placed ?? []), obj];
              });
              setObjSelId(id);
            }
            setPlacingTypeId(null);
            return;
          }
          if (polyDraw) {
            setPolyDraw([...polyDraw, toWorld(e)]);
            return;
          }
          if (tool === 'heat') {
            setHeatDraw([...(heatDraw ?? []), toWorld(e)]);
            return;
          }
          if (tool === 'electro') {
            // dockt an nächste Wand (Wand-Symbole) bzw. frei (Deckenauslass)
            const p = toWorld(e);
            const item: ElectroItem = { id: uid('el'), kind: electroKind };
            if (electroKind === 'deckenauslass') {
              item.x = Math.round(p.x);
              item.y = Math.round(p.y);
            } else {
              let best: { i: number; s: number; dist: number } | null = null;
              for (let i = 0; i < pts.length; i++) {
                const { s, distCm } = projectOntoWall(pts, i, p);
                const len = wallLengthCm(pts, i);
                if (s < 0 || s > len) continue;
                if (!best || distCm < best.dist) best = { i, s, dist: distCm };
              }
              if (best) {
                item.wallIndex = best.i;
                item.offsetCm = Math.round(best.s);
              } else {
                item.x = Math.round(p.x);
                item.y = Math.round(p.y);
              }
            }
            commit((_fp, _h, r) => {
              const v = r.variants.find((x) => x.id === r.activeVariantId);
              if (v) v.electro = [...(v.electro ?? []), item];
            });
            return;
          }
          if (tool === 'pin') {
            const p = toWorld(e);
            const pin: PlanPin = { id: uid('pin'), x: Math.round(p.x), y: Math.round(p.y), category: pinCat, text: '' };
            commit((_fp, _h, r) => {
              r.pins = [...(r.pins ?? []), pin];
            });
            setPinEdit(pin.id);
            setTool('select');
            return;
          }
          if (tool === 'wall') {
            wallToolClick(e);
            return;
          }
          if (tool === 'measure') {
            const p = snapMeasurePoint(plan, toWorld(e));
            if (!measureStart) {
              setMeasureStart(p);
            } else {
              setSessionMeasures((ms) => [...ms, { id: uid('mess'), a: measureStart, b: p }]);
              setMeasureStart(null);
            }
            return;
          }
          if (!placing) {
            setSelectedId(null);
            setEditing(null);
            setSelWall(null);
            setObjSelId(null);
          }
        }}
        onDoubleClick={() => {
          if (tool === 'wall') {
            setWallStart(null);
            setLenBuf('');
          }
          // Heizzone schließen (≥3 Punkte)
          if (heatDraw && heatDraw.length >= 3) {
            const poly = heatDraw.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }));
            commit((_fp, _h, r) => {
              const v = r.variants.find((x) => x.id === r.activeVariantId);
              if (v) v.heatZones = [...(v.heatZones ?? []), { id: uid('hz'), poly }];
            });
            setHeatDraw(null);
            setTool('select');
            return;
          }
          // Sonderform schließen (≥3 Punkte)
          if (polyDraw && polyDraw.length >= 3) {
            const cx = polyDraw.reduce((s, p) => s + p.x, 0) / polyDraw.length;
            const cy = polyDraw.reduce((s, p) => s + p.y, 0) / polyDraw.length;
            const rel = polyDraw.map((p) => ({ x: Math.round(p.x - cx), y: Math.round(p.y - cy) }));
            const b = {
              w: Math.max(...rel.map((p) => p.x)) - Math.min(...rel.map((p) => p.x)),
              d: Math.max(...rel.map((p) => p.y)) - Math.min(...rel.map((p) => p.y)),
            };
            const id = uid('po');
            const obj: PlacedObject = {
              id, typeId: 'custom', label: t('objects.customShape'),
              x: Math.round(cx), y: Math.round(cy), rotationDeg: 0,
              widthCm: Math.max(20, b.w), depthCm: Math.max(20, b.d), heightCm: 75,
              shape: 'poly', poly: rel, tier: 'premium',
            };
            commit((_fp, _h, r) => {
              const v = r.variants.find((x) => x.id === r.activeVariantId);
              if (!v) return;
              v.placed = [...(v.placed ?? []), obj];
            });
            setPolyDraw(null);
            setObjSelId(id);
          }
        }}
        data-testid="floorplan-svg"
      >
        {/* W7: cm/m-Raster (zurückhaltend) */}
        {showGrid && (() => {
          const lines: React.ReactNode[] = [];
          const startX = Math.floor(minX / gridStep) * gridStep;
          const endX = minX + spanX;
          const startY = Math.floor(minY / gridStep) * gridStep;
          const endY = minY + spanY;
          for (let gx = startX; gx <= endX + gridStep; gx += gridStep) {
            const major = Math.round(gx) % 100 === 0;
            lines.push(<line key={`gx${gx}`} x1={tx(gx)} y1={ty(startY - gridStep)} x2={tx(gx)} y2={ty(endY + gridStep)} stroke="#1A1814" strokeWidth={major ? 0.5 : 0.25} opacity={major ? 0.14 : 0.07} />);
          }
          for (let gy = startY; gy <= endY + gridStep; gy += gridStep) {
            const major = Math.round(gy) % 100 === 0;
            lines.push(<line key={`gy${gy}`} x1={tx(startX - gridStep)} y1={ty(gy)} x2={tx(endX + gridStep)} y2={ty(gy)} stroke="#1A1814" strokeWidth={major ? 0.5 : 0.25} opacity={major ? 0.14 : 0.07} />);
          }
          return <g data-testid="plan-grid">{lines}</g>;
        })()}

        <polygon points={poly} fill="rgba(0,0,0,0.04)" stroke="#1A1814" strokeWidth={2} />

        {/* W7: Lineale oben/links mit Cursor-Marker */}
        {showRulers && (() => {
          const ticks: React.ReactNode[] = [];
          for (let gx = Math.ceil(minX / 50) * 50; gx <= minX + spanX; gx += 50) {
            const major = Math.round(gx) % 100 === 0;
            ticks.push(<line key={`rx${gx}`} x1={tx(gx)} y1={10} x2={tx(gx)} y2={major ? 18 : 14} stroke="#6b6256" strokeWidth={0.8} />);
            if (major) ticks.push(<text key={`rxt${gx}`} x={tx(gx)} y={8} fill="#6b6256" fontSize={7} textAnchor="middle">{(gx / CM_PER_M).toFixed(0)}</text>);
          }
          for (let gy = Math.ceil(minY / 50) * 50; gy <= minY + spanY; gy += 50) {
            const major = Math.round(gy) % 100 === 0;
            ticks.push(<line key={`ry${gy}`} x1={10} y1={ty(gy)} x2={major ? 18 : 14} y2={ty(gy)} stroke="#6b6256" strokeWidth={0.8} />);
            if (major) ticks.push(<text key={`ryt${gy}`} x={7} y={ty(gy) + 2} fill="#6b6256" fontSize={7} textAnchor="middle">{(gy / CM_PER_M).toFixed(0)}</text>);
          }
          return (
            <g data-testid="plan-rulers">
              <line x1={10} y1={10} x2={width - 10} y2={10} stroke="#6b6256" strokeWidth={0.8} />
              <line x1={10} y1={10} x2={10} y2={height - 10} stroke="#6b6256" strokeWidth={0.8} />
              {ticks}
              {cursorPos && (
                <>
                  <line x1={tx(cursorPos.x)} y1={10} x2={tx(cursorPos.x)} y2={18} stroke="#C9A84C" strokeWidth={1.5} />
                  <line x1={10} y1={ty(cursorPos.y)} x2={18} y2={ty(cursorPos.y)} stroke="#C9A84C" strokeWidth={1.5} />
                </>
              )}
            </g>
          );
        })()}

        {/* W7: dezenter Nordpfeil (per Drag drehbar) */}
        {(() => {
          const deg = northLive ?? plan.northAngleDeg ?? 0;
          const cx = width - 34;
          const cy = 34;
          return (
            <g
              transform={`rotate(${deg} ${cx} ${cy})`}
              style={{ cursor: 'grab' }}
              onPointerDown={(e) => {
                e.stopPropagation();
                northDrag.current = true;
                (e.currentTarget as Element).setPointerCapture(e.pointerId);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setNorthEdit(true);
              }}
              data-testid="north-arrow"
            >
              <circle cx={cx} cy={cy} r={14} fill="none" stroke="#9A958A" strokeWidth={0.8} opacity={0.7} />
              <path d={`M ${cx} ${cy - 11} L ${cx - 4} ${cy + 6} L ${cx} ${cy + 2} L ${cx + 4} ${cy + 6} Z`} fill="#C9A84C" opacity={0.9} />
              <text x={cx} y={cy - 16} fill="#6b6256" fontSize={8} textAnchor="middle">N</text>
            </g>
          );
        })()}

        {/* Umriss-Wände: Klickflächen + Eigenschaften-Anzeige (W4) */}
        {tool === 'select' &&
          pts.map((p, i) => {
            const b = pts[(i + 1) % pts.length];
            const props = plan.wallProps?.[i];
            const isSel = selWall === i;
            return (
              <g key={`wp-${i}`}>
                {(props?.loadbearing || isSel) && (
                  <line
                    x1={tx(p.x)} y1={ty(p.y)} x2={tx(b.x)} y2={ty(b.y)}
                    stroke={isSel ? '#C9A84C' : '#1A1814'}
                    strokeWidth={props?.loadbearing ? 5 : 4}
                    opacity={isSel ? 0.9 : 0.8}
                  />
                )}
                {splittingWall === i && (
                  <line
                    x1={tx(p.x)} y1={ty(p.y)} x2={tx(b.x)} y2={ty(b.y)}
                    stroke="#C9A84C" strokeWidth={4} strokeDasharray="3 3" opacity={0.7}
                  />
                )}
                <line
                  x1={tx(p.x)} y1={ty(p.y)} x2={tx(b.x)} y2={ty(b.y)}
                  stroke="transparent" strokeWidth={12}
                  style={{ cursor: splittingWall === i ? 'crosshair' : 'pointer' }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    // W5: Teilen-Modus — Klickpunkt teilt die Wand in zwei Segmente.
                    if (splittingWall === i) {
                      const { s } = projectOntoWall(pts, i, toWorld(e));
                      const at = Math.round(s / 10) * 10;
                      commit((_fp, _h, r) => {
                        splitWallAt(r, i, at);
                      });
                      setSplittingWall(null);
                      setSelWall(null);
                      return;
                    }
                    setSelWall(i);
                    setSelectedId(null);
                  }}
                  data-testid={`wall-hit-${i}`}
                />
              </g>
            );
          })}

        {/* Innenwände (W4) */}
        {(plan.innerWalls ?? []).map((iw) => {
          const isSel = selWall === iw.id;
          const strokePx = Math.max(3, iw.thicknessCm * scale);
          const color = iw.wallType === 'halbhoch' ? '#9B8F7A' : iw.loadbearing ? '#3A342C' : '#5C544A';
          return (
            <g key={iw.id}>
              <line
                x1={tx(iw.a.x)} y1={ty(iw.a.y)} x2={tx(iw.b.x)} y2={ty(iw.b.y)}
                stroke={isSel ? '#C9A84C' : color}
                strokeWidth={strokePx}
                strokeLinecap="butt"
                opacity={iw.wallType === 'halbhoch' ? 0.65 : 0.95}
                data-testid={`inner-wall-${iw.id}`}
              />
              <line
                x1={tx(iw.a.x)} y1={ty(iw.a.y)} x2={tx(iw.b.x)} y2={ty(iw.b.y)}
                stroke="transparent" strokeWidth={Math.max(14, strokePx + 8)}
                style={{ cursor: 'pointer' }}
                onPointerDown={(e) => {
                  if (tool !== 'select') return;
                  e.stopPropagation();
                  setSelWall(iw.id);
                  setSelectedId(null);
                }}
              />
              {isSel && (
                <text
                  x={(tx(iw.a.x) + tx(iw.b.x)) / 2}
                  y={(ty(iw.a.y) + ty(iw.b.y)) / 2}
                  fill="#C9A84C" fontSize={9} textAnchor="middle" dy={-6}
                >
                  {(Math.hypot(iw.b.x - iw.a.x, iw.b.y - iw.a.y) / CM_PER_M).toFixed(2)} m
                </text>
              )}
            </g>
          );
        })}

        {/* Wand-Vorschau mit Live-Meter (W4-Kern) */}
        {tool === 'wall' && wallStart && wallCursor && (() => {
          const lenM = Math.hypot(wallCursor.x - wallStart.x, wallCursor.y - wallStart.y) / CM_PER_M;
          const angle = Math.round((Math.atan2(wallCursor.y - wallStart.y, wallCursor.x - wallStart.x) * 180) / Math.PI);
          return (
            <g data-testid="wall-preview">
              <line
                x1={tx(wallStart.x)} y1={ty(wallStart.y)} x2={tx(wallCursor.x)} y2={ty(wallCursor.y)}
                stroke="#C9A84C" strokeWidth={4} strokeDasharray="8 4" strokeLinecap="round"
              />
              <circle cx={tx(wallStart.x)} cy={ty(wallStart.y)} r={4} fill="#C9A84C" />
              <text
                x={tx(wallCursor.x)} y={ty(wallCursor.y)}
                fill="#C9A84C" fontSize={16} fontWeight={700} textAnchor="middle" dy={-14}
                data-testid="wall-live-length"
              >
                {lenBuf ? `${lenBuf} ⏎` : `${lenM.toFixed(2)} m`}
              </text>
              <text x={tx(wallCursor.x)} y={ty(wallCursor.y)} fill="#6b6256" fontSize={9} textAnchor="middle" dy={-2}>
                {((angle % 360) + 360) % 360}°
              </text>
            </g>
          );
        })()}
        {tool === 'wall' && !wallStart && wallCursor && (
          <circle cx={tx(wallCursor.x)} cy={ty(wallCursor.y)} r={4} fill="none" stroke="#C9A84C" strokeWidth={1.5} />
        )}

        {/* Wand-Hervorhebung beim Wechsel */}
        {switchPreview !== null && (
          <line
            x1={tx(pts[switchPreview].x)}
            y1={ty(pts[switchPreview].y)}
            x2={tx(pts[(switchPreview + 1) % pts.length].x)}
            y2={ty(pts[(switchPreview + 1) % pts.length].y)}
            stroke="#C9A84C"
            strokeWidth={5}
            opacity={0.5}
            data-testid="wall-switch-preview"
          />
        )}

        {/* Wandmaße */}
        {pts.map((p, i) => {
          const b = pts[(i + 1) % pts.length];
          return (
            <text key={i} x={(tx(p.x) + tx(b.x)) / 2} y={(ty(p.y) + ty(b.y)) / 2} fill="#6b6256" fontSize={9} textAnchor="middle" dy={-5}>
              {(wallLengthCm(pts, i) / CM_PER_M).toFixed(2)} m
            </text>
          );
        })}

        {/* Öffnungen (interaktiv) */}
        {plan.openings.map((raw) => {
          const o = liveOpening(raw);
          const a = pts[o.wallIndex % pts.length];
          const b = pts[(o.wallIndex + 1) % pts.length];
          const len = wallLengthCm(pts, o.wallIndex) || 1;
          const t0 = o.offsetCm / len;
          const t1 = Math.min(1, (o.offsetCm + o.widthCm) / len);
          const x0 = a.x + (b.x - a.x) * t0;
          const y0 = a.y + (b.y - a.y) * t0;
          const x1 = a.x + (b.x - a.x) * t1;
          const y1 = a.y + (b.y - a.y) * t1;
          const color = o.kind === 'fenster' ? '#5A7488' : o.kind === 'durchbruch' ? '#8C9C8A' : '#B0855B';
          const isSel = o.id === selectedId;
          const symbol = openingSymbol(o, a, b, inwardNormal(pts, o.wallIndex));
          const dragging = drag.current?.active && drag.current.id === o.id;
          const dists = cornerDistances({ ...plan, openings: plan.openings.map(liveOpening) }, o);
          return (
            <g key={o.id}>
              {symbol.map((s, i) => (
                <polyline
                  key={i}
                  points={s.pts.map((p) => `${tx(p.x)},${ty(p.y)}`).join(' ')}
                  fill="none"
                  stroke={color}
                  strokeWidth={s.style === 'solid' ? 1.6 : 1}
                  strokeDasharray={s.style === 'dashed' ? '4 3' : undefined}
                  opacity={s.style === 'thin' ? 0.75 : 1}
                />
              ))}
              {/* Griff: breite unsichtbare Fläche (touch-tauglich) */}
              <line
                x1={tx(x0)} y1={ty(y0)} x2={tx(x1)} y2={ty(y1)}
                stroke={isSel ? '#C9A84C' : color}
                strokeWidth={isSel || dragging ? 6 : 4}
                strokeLinecap="round"
                opacity={o.kind === 'durchbruch' ? 0.5 : 1}
              />
              <line
                x1={tx(x0)} y1={ty(y0)} x2={tx(x1)} y2={ty(y1)}
                stroke="transparent"
                strokeWidth={18}
                style={{ cursor: 'grab' }}
                onPointerDown={(e) => startDrag(e, raw)}
                data-testid={`opening-handle-${o.id}`}
              />
              {/* Live-Eckmaße beim Ziehen/Auswählen */}
              {(dragging || isSel) && (
                <>
                  <CornerLabel
                    plan={plan} pts={pts} o={o} side="links" cm={dists.leftCm}
                    tx={tx} ty={ty}
                    onClick={() => setEditing({ side: 'links', value: (dists.leftCm / CM_PER_M).toFixed(2) })}
                  />
                  <CornerLabel
                    plan={plan} pts={pts} o={o} side="rechts" cm={dists.rightCm}
                    tx={tx} ty={ty}
                    onClick={() => setEditing({ side: 'rechts', value: (dists.rightCm / CM_PER_M).toFixed(2) })}
                  />
                </>
              )}
            </g>
          );
        })}

        {/* Erweiterung 8 · T4: FBH-Zonen (schraffiert, unter Möbeln) */}
        {layers.heat && (() => {
          const variant = room.variants.find((v) => v.id === room.activeVariantId);
          return (variant?.heatZones ?? []).map((z) => {
            const areaM2 = footprintAreaM2(z.poly);
            const cx = z.poly.reduce((s, p) => s + p.x, 0) / z.poly.length;
            const cy = z.poly.reduce((s, p) => s + p.y, 0) / z.poly.length;
            return (
              <g key={z.id} data-testid={`heat-zone-${z.id}`}>
                <polygon
                  points={z.poly.map((p) => `${tx(p.x)},${ty(p.y)}`).join(' ')}
                  fill="rgba(193,110,79,0.12)"
                  stroke="#C16E4F"
                  strokeWidth={1}
                  strokeDasharray="6 3"
                  style={{ cursor: tool === 'select' ? 'pointer' : 'default' }}
                  onPointerDown={(e) => {
                    if (tool !== 'select') return;
                    e.stopPropagation();
                    if (window.confirm(t('heat.delete'))) {
                      commit((_fp, _h, r) => {
                        const v = r.variants.find((x) => x.id === r.activeVariantId);
                        if (v) v.heatZones = (v.heatZones ?? []).filter((x) => x.id !== z.id);
                      });
                    }
                  }}
                />
                <text x={tx(cx)} y={ty(cy)} fill="#C16E4F" fontSize={9} fontWeight={600} textAnchor="middle" pointerEvents="none">
                  FBH {areaM2.toFixed(1).replace('.', ',')} m²
                </text>
              </g>
            );
          });
        })()}
        {tool === 'heat' && heatDraw && heatDraw.length > 0 && (
          <polyline
            points={[...heatDraw, ...(cursorPos ? [cursorPos] : [])].map((p) => `${tx(p.x)},${ty(p.y)}`).join(' ')}
            fill="rgba(193,110,79,0.08)"
            stroke="#C16E4F"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            data-testid="heat-draw"
          />
        )}

        {/* Erweiterung 8: Einrichtung (Teppiche unter Möbeln) */}
        {(() => {
          const variant = room.variants.find((v) => v.id === room.activeVariantId);
          if (!variant) return null;
          return (
            <ObjectLayer
              room={room}
              variant={variant}
              commit={commit}
              tx={tx}
              ty={ty}
              toWorld={toWorld}
              scale={scale}
              selectedId={objSelId}
              setSelectedId={(id) => {
                setObjSelId(id);
                if (id) {
                  setSelectedId(null);
                  setSelWall(null);
                }
              }}
              showDims={showObjDims}
              cursorPos={cursorPos}
              placingTypeId={placingTypeId}
              interactive={tool === 'select' && !placingTypeId && !polyDraw}
            />
          );
        })()}

        {/* Erweiterung 8: Sonderform-Vorschau */}
        {polyDraw && polyDraw.length > 0 && (
          <g data-testid="poly-draw">
            <polyline
              points={[...polyDraw, ...(cursorPos ? [cursorPos] : [])].map((p) => `${tx(p.x)},${ty(p.y)}`).join(' ')}
              fill="rgba(201,168,76,0.08)"
              stroke="#C9A84C"
              strokeWidth={1.5}
              strokeDasharray="5 3"
            />
            {polyDraw.map((p, i) => (
              <circle key={i} cx={tx(p.x)} cy={ty(p.y)} r={3} fill="#C9A84C" />
            ))}
          </g>
        )}

        {/* Erweiterung 8 · T3: Elektro-Symbole */}
        {layers.electro && (() => {
          const variant = room.variants.find((v) => v.id === room.activeVariantId);
          return (variant?.electro ?? []).map((el) => {
            let px: number;
            let py: number;
            let angle = 0;
            if (el.wallIndex !== undefined && el.offsetCm !== undefined) {
              const p = pointOnWall(pts, el.wallIndex, el.offsetCm);
              const inward = inwardNormal(pts, el.wallIndex);
              px = p.x + inward.x * 11;
              py = p.y + inward.y * 11;
              const a = pts[el.wallIndex];
              const b = pts[(el.wallIndex + 1) % pts.length];
              angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
            } else {
              px = el.x ?? 0;
              py = el.y ?? 0;
            }
            const sym = electroSymbol(el.kind, px, py, angle);
            return (
              <g
                key={el.id}
                style={{ cursor: tool === 'select' ? 'pointer' : 'default' }}
                onPointerDown={(e) => {
                  if (tool !== 'select') return;
                  e.stopPropagation();
                  commit((_fp, _h, r) => {
                    const v = r.variants.find((x) => x.id === r.activeVariantId);
                    if (v) v.electro = (v.electro ?? []).filter((x) => x.id !== el.id);
                  });
                }}
                data-testid={`electro-${el.id}`}
              >
                {sym.map((l, i) => (
                  <polyline
                    key={i}
                    points={l.pts.map((p) => `${tx(p.x)},${ty(p.y)}`).join(' ')}
                    fill="none"
                    stroke="#8C9C8A"
                    strokeWidth={l.style === 'thin' ? 0.9 : 1.4}
                  />
                ))}
              </g>
            );
          });
        })()}

        {/* Erweiterung 8 · T6: Notiz-Pins (intern; nie im Kunden-/Präsentationsmodus) */}
        {internalAllowed && layers.pins && (room.pins ?? []).map((pin) => (
          <g
            key={pin.id}
            style={{ cursor: 'pointer' }}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (tool === 'select') setPinEdit(pin.id);
            }}
            data-testid={`pin-${pin.id}`}
          >
            <circle cx={tx(pin.x)} cy={ty(pin.y)} r={7} fill={PIN_COLORS[pin.category]} stroke="#0A0A0B" strokeWidth={0.8} opacity={pin.done ? 0.4 : 1} />
            <text x={tx(pin.x)} y={ty(pin.y)} fill="#0A0A0B" fontSize={8} fontWeight={700} textAnchor="middle" dy={2.8} pointerEvents="none">
              {pin.category.charAt(0).toUpperCase()}
            </text>
          </g>
        ))}

        {/* Erweiterung 8 · T5: Laufwege-Hinweise (dezent, ignorierbar; Präsentation NIE) */}
        {layers.hints && mode !== 'praesentation' && (() => {
          const variant = room.variants.find((v) => v.id === room.activeVariantId);
          const hints = checkWayfinding(plan, variant?.placed ?? [], projectDismissed);
          return hints.map((h) => (
            <g key={h.key} data-testid="wayhint">
              <circle cx={tx(h.at.x)} cy={ty(h.at.y)} r={8} fill="rgba(200,85,61,0.15)" stroke="#C8553D" strokeWidth={1} strokeDasharray="2 1.5" />
              <text x={tx(h.at.x)} y={ty(h.at.y)} fill="#C8553D" fontSize={10} fontWeight={700} textAnchor="middle" dy={3} pointerEvents="none">!</text>
              <title>{t(h.messageKey)}</title>
              <circle
                cx={tx(h.at.x) + 9}
                cy={ty(h.at.y) - 9}
                r={5}
                fill="rgba(0,0,0,0.4)"
                style={{ cursor: 'pointer' }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onDismissHint?.(h.key);
                }}
                data-testid="wayhint-dismiss"
              />
              <text x={tx(h.at.x) + 9} y={ty(h.at.y) - 9} fill="#fff" fontSize={7} textAnchor="middle" dy={2.5} pointerEvents="none">×</text>
            </g>
          ));
        })()}

        {/* W6: Raum-Etikett (Name · Fläche · Umfang), Doppelklick = umbenennen */}
        {(() => {
          const c = polygonCentroid(pts);
          const d = deriveAreas(plan, room.heightCm);
          return (
            <g data-testid="room-label">
              <text
                x={tx(c.x)} y={ty(c.y)}
                fill="#1A1814" fontSize={13} fontWeight={600} textAnchor="middle"
                style={{ cursor: 'text' }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setRenaming(room.name);
                }}
                data-testid="room-label-name"
              >
                {room.name}
              </text>
              <text x={tx(c.x)} y={ty(c.y)} fill="#6b6256" fontSize={9} textAnchor="middle" dy={13} pointerEvents="none">
                {d.floorAreaM2.toFixed(2).replace('.', ',')} m² · {d.perimeterM.toFixed(2).replace('.', ',')} m
              </text>
            </g>
          );
        })()}

        {/* W6: behaltene Messungen (persistiert) */}
        {(plan.measurements ?? []).map((m) => {
          const distM = Math.hypot(m.b.x - m.a.x, m.b.y - m.a.y) / CM_PER_M;
          const mid = { x: (m.a.x + m.b.x) / 2, y: (m.a.y + m.b.y) / 2 };
          return (
            <g key={m.id} data-testid={`measure-kept-${m.id}`}>
              <line x1={tx(m.a.x)} y1={ty(m.a.y)} x2={tx(m.b.x)} y2={ty(m.b.y)} stroke="#C9A84C" strokeWidth={1.2} />
              <text x={tx(mid.x)} y={ty(mid.y)} fill="#C9A84C" fontSize={9} fontWeight={600} textAnchor="middle" dy={-3}>
                {distM.toFixed(2).replace('.', ',')} m
              </text>
              <g
                style={{ cursor: 'pointer' }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  commit((fp) => {
                    fp.measurements = (fp.measurements ?? []).filter((x) => x.id !== m.id);
                  });
                }}
                data-testid={`measure-kept-delete-${m.id}`}
              >
                <circle cx={tx(mid.x) + 24} cy={ty(mid.y) - 6} r={6} fill="rgba(0,0,0,0.35)" />
                <text x={tx(mid.x) + 24} y={ty(mid.y) - 6} fill="#fff" fontSize={8} textAnchor="middle" dy={2.5}>×</text>
              </g>
            </g>
          );
        })}

        {/* W6: Sitzungs-Messungen (Klick auf Maßzahl = behalten) */}
        {sessionMeasures.map((m) => {
          const distM = Math.hypot(m.b.x - m.a.x, m.b.y - m.a.y) / CM_PER_M;
          const mid = { x: (m.a.x + m.b.x) / 2, y: (m.a.y + m.b.y) / 2 };
          return (
            <g key={m.id} data-testid={`measure-${m.id}`}>
              <line x1={tx(m.a.x)} y1={ty(m.a.y)} x2={tx(m.b.x)} y2={ty(m.b.y)} stroke="#6b6256" strokeWidth={1.2} strokeDasharray="5 3" />
              <text
                x={tx(mid.x)} y={ty(mid.y)}
                fill="#1A1814" fontSize={9} fontWeight={600} textAnchor="middle" dy={-3}
                style={{ cursor: 'pointer' }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  // behalten → persistiert (erscheint im Aufmaß-PDF)
                  commit((fp) => {
                    fp.measurements = [...(fp.measurements ?? []), { id: m.id, a: m.a, b: m.b }];
                  });
                  setSessionMeasures((ms) => ms.filter((x) => x.id !== m.id));
                }}
                data-testid={`measure-keep-${m.id}`}
              >
                {distM.toFixed(2).replace('.', ',')} m ⊕
              </text>
              <g
                style={{ cursor: 'pointer' }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setSessionMeasures((ms) => ms.filter((x) => x.id !== m.id));
                }}
              >
                <circle cx={tx(mid.x) + 28} cy={ty(mid.y) - 6} r={6} fill="rgba(0,0,0,0.35)" />
                <text x={tx(mid.x) + 28} y={ty(mid.y) - 6} fill="#fff" fontSize={8} textAnchor="middle" dy={2.5}>×</text>
              </g>
            </g>
          );
        })}

        {/* W6: Mess-Vorschau */}
        {tool === 'measure' && measureStart && measureCursor && (
          <g data-testid="measure-preview">
            <line
              x1={tx(measureStart.x)} y1={ty(measureStart.y)} x2={tx(measureCursor.x)} y2={ty(measureCursor.y)}
              stroke="#C9A84C" strokeWidth={1.5} strokeDasharray="5 3"
            />
            <text
              x={(tx(measureStart.x) + tx(measureCursor.x)) / 2}
              y={(ty(measureStart.y) + ty(measureCursor.y)) / 2}
              fill="#C9A84C" fontSize={12} fontWeight={700} textAnchor="middle" dy={-6}
            >
              {(Math.hypot(measureCursor.x - measureStart.x, measureCursor.y - measureStart.y) / CM_PER_M).toFixed(2).replace('.', ',')} m
            </text>
          </g>
        )}
        {tool === 'measure' && measureCursor && (
          <circle cx={tx(measureCursor.x)} cy={ty(measureCursor.y)} r={3.5} fill="none" stroke="#C9A84C" strokeWidth={1.5} />
        )}

        {/* Geist beim Duplizieren */}
        {placing && ghost && (() => {
          const a = pts[ghost.wallIndex % pts.length];
          const b = pts[(ghost.wallIndex + 1) % pts.length];
          const len = wallLengthCm(pts, ghost.wallIndex) || 1;
          const g0 = ghost.offsetCm / len;
          const g1 = (ghost.offsetCm + placing.widthCm) / len;
          return (
            <line
              x1={tx(a.x + (b.x - a.x) * g0)} y1={ty(a.y + (b.y - a.y) * g0)}
              x2={tx(a.x + (b.x - a.x) * g1)} y2={ty(a.y + (b.y - a.y) * g1)}
              stroke="#C9A84C" strokeWidth={5} strokeDasharray="6 4" strokeLinecap="round"
              data-testid="placing-ghost"
            />
          );
        })()}
      </svg>

      {/* Werkzeugleiste (W4) */}
      <div className="absolute top-1 left-1 flex gap-1" data-testid="editor-tools">
        <button
          className={`px-2 py-1 text-[11px] border rounded inline-flex items-center gap-1 bg-surface ${tool === 'select' ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
          onClick={() => { setTool('select'); setWallStart(null); }}
          title={`${t('editor.toolSelect')} (Esc)`}
          data-testid="tool-select"
        >
          <MousePointer2 size={11} /> {t('editor.toolSelect')}
        </button>
        <button
          className={`px-2 py-1 text-[11px] border rounded inline-flex items-center gap-1 bg-surface ${tool === 'wall' ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
          onClick={() => { setTool('wall'); setSelectedId(null); setSelWall(null); }}
          title={`${t('editor.toolWall')} (W)`}
          data-testid="tool-wall"
        >
          <PenLine size={11} /> {t('editor.toolWall')}
        </button>
        <button
          className={`px-2 py-1 text-[11px] border rounded inline-flex items-center gap-1 bg-surface ${tool === 'measure' ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
          onClick={() => { setTool('measure'); setSelectedId(null); setSelWall(null); setWallStart(null); }}
          title={`${t('editor.toolMeasure')} (M)`}
          data-testid="tool-measure"
        >
          <Ruler size={11} /> {t('editor.toolMeasure')}
        </button>
        {tool === 'measure' && (
          <span className="text-[10px] text-muted bg-surface/90 border border-line rounded px-2 py-1">
            {measureStart ? t('editor.measureHint2') : t('editor.measureHint1')}
          </span>
        )}
        <button
          className={`px-2 py-1 text-[11px] border rounded inline-flex items-center gap-1 bg-surface ${paletteOpen || placingTypeId ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
          onClick={() => {
            setPaletteOpen((v) => !v);
            setPlacingTypeId(null);
            setPolyDraw(null);
          }}
          title={`${t('objects.tool')} (E)`}
          data-testid="tool-objects"
        >
          <Armchair size={11} /> {t('objects.tool')}
        </button>
        <button
          className={`px-2 py-1 text-[11px] border rounded bg-surface ${showObjDims ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
          onClick={() => setShowObjDims((v) => !v)}
          title={t('objects.showDims')}
          data-testid="toggle-obj-dims"
        >
          ⤢
        </button>
        <button
          className={`px-2 py-1 text-[11px] border rounded inline-flex items-center gap-1 bg-surface ${tool === 'electro' ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
          onClick={() => { setTool(tool === 'electro' ? 'select' : 'electro'); setPlacingTypeId(null); }}
          title={t('electro.tool')}
          data-testid="tool-electro"
        >
          <Zap size={11} /> {t('electro.tool')}
        </button>
        {tool === 'electro' && (
          <select
            className="field-input text-[10px] py-0.5 w-28"
            value={electroKind}
            onChange={(e) => setElectroKind(e.target.value as ElectroKind)}
            data-testid="electro-kind"
          >
            {ELECTRO_KINDS.map((k) => (
              <option key={k} value={k}>{ELECTRO_LABELS[k]}</option>
            ))}
          </select>
        )}
        <button
          className={`px-2 py-1 text-[11px] border rounded inline-flex items-center gap-1 bg-surface ${tool === 'heat' ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
          onClick={() => { setTool(tool === 'heat' ? 'select' : 'heat'); setHeatDraw(tool === 'heat' ? null : []); }}
          title={t('heat.tool')}
          data-testid="tool-heat"
        >
          <Flame size={11} /> {t('heat.tool')}
        </button>
        {internalAllowed && (
          <button
            className={`px-2 py-1 text-[11px] border rounded inline-flex items-center gap-1 bg-surface ${tool === 'pin' ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
            onClick={() => setTool(tool === 'pin' ? 'select' : 'pin')}
            title={t('pin.tool')}
            data-testid="tool-pin"
          >
            <MapPin size={11} /> {t('pin.tool')}
          </button>
        )}
        {tool === 'pin' && internalAllowed && (
          <select
            className="field-input text-[10px] py-0.5 w-24"
            value={pinCat}
            onChange={(e) => setPinCat(e.target.value as PinCategory)}
            data-testid="pin-cat"
          >
            {PIN_CATEGORIES.map((c) => (
              <option key={c} value={c}>{t(`pin.${c}`)}</option>
            ))}
          </select>
        )}
        <button
          className={`px-2 py-1 text-[11px] border rounded bg-surface ${showGrid ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
          onClick={() => {
            if (showGrid && gridStep === 50) setGridStep(25);
            else if (showGrid && gridStep === 25) { setShowGrid(false); setGridStep(50); }
            else setShowGrid(true);
          }}
          title={t('editor.grid')}
          data-testid="toggle-grid"
        >
          # {showGrid ? `${gridStep}` : ''}
        </button>
        <button
          className={`px-2 py-1 text-[11px] border rounded bg-surface ${showRulers ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
          onClick={() => setShowRulers((v) => !v)}
          title={t('editor.rulers')}
          data-testid="toggle-rulers"
        >
          ⊾
        </button>
        {/* Ebenen-Schalter (Erweiterung 8 · T11) */}
        {(['electro', 'heat', 'pins', 'hints'] as const)
          .filter((ly) => ly !== 'hints' || mode !== 'praesentation')
          .filter((ly) => ly !== 'pins' || internalAllowed)
          .map((ly) => (
            <button
              key={ly}
              className={`px-1.5 py-1 text-[10px] border rounded bg-surface ${layers[ly] ? 'border-gold/60 text-gold' : 'border-line text-muted line-through'}`}
              onClick={() => setLayers((s) => ({ ...s, [ly]: !s[ly] }))}
              title={`${t('layers.title')}: ${t(`layers.${ly}`)}`}
              data-testid={`layer-${ly}`}
            >
              {t(`layers.${ly}`)}
            </button>
          ))}
        <button
          className="px-2 py-1 text-[11px] border border-line rounded bg-surface text-muted hover:text-text"
          onClick={() => setShowHelp(true)}
          title={t('editor.help')}
          data-testid="editor-help"
        >
          ?
        </button>
        {(sessionMeasures.length > 0 || (plan.measurements ?? []).length > 0) && (
          <button
            className="px-2 py-1 text-[11px] border border-line rounded bg-surface text-muted hover:text-danger"
            onClick={() => {
              setSessionMeasures([]);
              if ((plan.measurements ?? []).length > 0) {
                commit((fp) => {
                  fp.measurements = [];
                });
              }
            }}
            data-testid="measure-clear-all"
          >
            {t('editor.clearMeasures')}
          </button>
        )}
        {tool === 'wall' && (
          <span className="text-[10px] text-muted bg-surface/90 border border-line rounded px-2 py-1">
            {wallStart ? t('editor.wallHint2') : t('editor.wallHint1')}
          </span>
        )}
      </div>

      {/* Wand-Eigenschaften (W4) */}
      {selWall !== null && tool === 'select' && splittingWall === null && (
        <WallPropsPanel
          plan={plan}
          selWall={selWall}
          heightCm={room.heightCm}
          commit={commit}
          onClose={() => setSelWall(null)}
          onStartSplit={(i) => {
            setSplittingWall(i);
          }}
          onDeleteWall={(i) => setDeleteAsk(i)}
          t={t}
        />
      )}

      {/* W5: Hinweis im Teilen-Modus */}
      {splittingWall !== null && (
        <div className="absolute bottom-1 left-1 text-[11px] text-gold bg-surface/90 border border-line rounded px-2 py-1" data-testid="split-mode-hint">
          {t('editor.splitWallHint')}
          <button className="ml-2 text-muted hover:text-text" onClick={() => setSplittingWall(null)} aria-label={t('common.cancel')}>
            <X size={10} />
          </button>
        </div>
      )}

      {/* W5: Wand-löschen-Dialog */}
      {deleteAsk !== null && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded" data-testid="wall-delete-dialog">
          <div className="card p-4 max-w-xs text-center">
            <p className="text-sm mb-1">{t('editor.deleteWallTitle')}</p>
            <p className="text-muted text-xs mb-2">
              {t('editor.deleteWallBody', { n: openingsOnWallPair(plan, deleteAsk) })}
            </p>
            {plan.wallProps?.[deleteAsk]?.loadbearing && (
              <p className="text-danger text-xs mb-2" data-testid="loadbearing-warning">
                {t('editor.deleteLoadbearing')}
              </p>
            )}
            <div className="flex gap-2 justify-center mt-3">
              <button className="btn btn-ghost text-xs py-1.5" onClick={() => setDeleteAsk(null)} data-testid="wall-delete-cancel">
                {t('common.cancel')}
              </button>
              <button
                className="btn btn-danger text-xs py-1.5"
                onClick={() => {
                  const idx = deleteAsk;
                  commit((_fp, _h, r) => {
                    deleteWall(r, idx);
                  });
                  setDeleteAsk(null);
                  setSelWall(null);
                }}
                data-testid="wall-delete-confirm"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Raum teilen? (W4) */}
      {splitAsk && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded" data-testid="split-dialog">
          <div className="card p-4 max-w-xs text-center">
            <p className="text-sm mb-1">{t('editor.splitTitle')}</p>
            <p className="text-muted text-xs mb-4">{t('editor.splitBody')}</p>
            <div className="flex flex-col gap-1.5">
              <button
                className="btn btn-primary text-xs py-1.5"
                onClick={() => {
                  const split = splitPolygon(pts, splitAsk.a, splitAsk.b);
                  if (split && onSplitRoom) onSplitRoom(split.polyA, split.polyB, splitAsk);
                  setSplitAsk(null);
                }}
                data-testid="split-confirm"
              >
                {t('editor.splitYes')}
              </button>
              <button
                className="btn btn-ghost text-xs py-1.5"
                onClick={() => {
                  const wall = splitAsk;
                  commit((fp) => {
                    fp.innerWalls = [...(fp.innerWalls ?? []), wall];
                  });
                  setSplitAsk(null);
                }}
                data-testid="split-wall-only"
              >
                {t('editor.splitNo')}
              </button>
              <button className="btn btn-ghost text-xs py-1.5" onClick={() => setSplitAsk(null)}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mini-Werkzeugleiste bei Auswahl */}
      {selected && !placing && (
        <div className="absolute top-1 right-1 flex gap-1">
          <button
            className="px-2 py-1 text-[11px] border border-line rounded bg-surface text-muted hover:text-gold inline-flex items-center gap-1"
            onClick={duplicate}
            title={`${t('editor.duplicate')} (D)`}
            data-testid="editor-duplicate"
          >
            <Copy size={11} /> {t('editor.duplicate')}
          </button>
        </div>
      )}
      {placing && (
        <div className="absolute top-1 left-1 text-[11px] text-gold bg-surface/90 border border-line rounded px-2 py-1" data-testid="placing-hint">
          {t('editor.placeHint')}
          <button className="ml-2 text-muted hover:text-text" onClick={() => { setPlacing(null); setGhost(null); }} aria-label={t('common.cancel')}>
            <X size={10} />
          </button>
        </div>
      )}

      {/* Erweiterung 8: Einrichtungs-Palette */}
      {paletteOpen && (
        <div className="absolute top-8 left-1 bg-surface/95 border border-line rounded p-2 w-56 max-h-72 overflow-y-auto z-10" data-testid="object-palette">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-medium">{t('objects.palette')}</p>
            <button className="text-muted hover:text-text" onClick={() => setPaletteOpen(false)} aria-label={t('common.cancel')}>
              <X size={12} />
            </button>
          </div>
          <input
            className="field-input text-xs py-1 mb-1.5"
            placeholder={t('objects.search')}
            value={paletteQuery}
            onChange={(e) => setPaletteQuery(e.target.value)}
            data-testid="palette-search"
          />
          <button
            className="w-full text-left px-2 py-1 text-[11px] text-gold hover:bg-gold-soft rounded"
            onClick={() => {
              setPolyDraw([]);
              setPaletteOpen(false);
            }}
            data-testid="palette-customshape"
          >
            ✎ {t('objects.drawCustom')}
          </button>
          {FURNITURE_TYPES.filter(
            (f) =>
              f.place &&
              (f.rooms.includes(room.type) || paletteQuery.length > 1) &&
              (paletteQuery === '' || f.name.toLowerCase().includes(paletteQuery.toLowerCase())),
          ).map((f) => (
            <button
              key={f.id}
              className="w-full text-left px-2 py-1 text-[11px] text-muted hover:text-text hover:bg-gold-soft rounded"
              onClick={() => {
                setPlacingTypeId(f.id);
                setPaletteOpen(false);
              }}
              data-testid={`palette-${f.id}`}
            >
              {f.name}
              <span className="opacity-60"> · {f.place!.defaultW}×{f.place!.defaultD}</span>
            </button>
          ))}
        </div>
      )}
      {placingTypeId && (
        <div className="absolute top-1 left-40 text-[11px] text-gold bg-surface/90 border border-line rounded px-2 py-1" data-testid="object-placing-hint">
          {t('objects.placeHint')}
        </div>
      )}
      {polyDraw && (
        <div className="absolute top-1 left-40 text-[11px] text-gold bg-surface/90 border border-line rounded px-2 py-1" data-testid="poly-hint">
          {t('objects.polyHint')}
        </div>
      )}

      {/* Erweiterung 8: Objekt-Eigenschaften */}
      {objSelId && (() => {
        const variant = room.variants.find((v) => v.id === room.activeVariantId);
        const o = variant?.placed?.find((x) => x.id === objSelId);
        if (!o) return null;
        const ft = findFurnitureType(o.typeId);
        const meta = ft?.place;
        const setObj = (fn: (obj: PlacedObject) => void) =>
          commit((_fp, _h, r) => {
            const v = r.variants.find((x) => x.id === r.activeVariantId);
            const target = v?.placed?.find((x) => x.id === objSelId);
            if (target) fn(target);
          });
        const dimInput = (label: string, value: number, set: (v: number) => void, min: number, max: number, testid: string) => (
          <label className="block text-[10px] text-muted">
            {label} (cm)
            <input
              className="field-input text-xs mt-0.5 py-1"
              defaultValue={Math.round(value)}
              key={`${objSelId}-${label}-${Math.round(value)}`}
              onBlur={(e) => {
                const v = Number(e.target.value.replace(',', '.'));
                if (Number.isFinite(v)) set(Math.max(min, Math.min(max, Math.round(v))));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              inputMode="numeric"
              data-testid={testid}
            />
          </label>
        );
        return (
          <div className="absolute top-8 right-1 bg-surface/95 border border-line rounded p-2.5 w-56 space-y-2 z-10 max-h-80 overflow-y-auto" data-testid="object-panel">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium truncate">{o.label ?? ft?.name ?? o.typeId}</p>
              <button className="text-muted hover:text-text" onClick={() => setObjSelId(null)} aria-label={t('common.cancel')}>
                <X size={12} />
              </button>
            </div>
            {meta?.hintTag === 'kamin' && <p className="text-[9px] text-warn">{t('objects.hintKamin')}</p>}
            {meta?.hintTag === 'treppe' && <p className="text-[9px] text-warn">{t('objects.hintTreppe')}</p>}
            <div className="grid grid-cols-3 gap-1.5">
              {dimInput(t('rooms.width'), o.widthCm, (v) => setObj((x) => { x.widthCm = v; }), meta?.minW ?? 10, meta?.maxW ?? 800, 'obj-w')}
              {dimInput(t('objects.depth'), o.depthCm, (v) => setObj((x) => { x.depthCm = v; }), meta?.minD ?? 10, meta?.maxD ?? 800, 'obj-d')}
              {dimInput(t('rooms.height'), o.heightCm, (v) => setObj((x) => { x.heightCm = v; }), 1, 350, 'obj-h')}
            </div>
            {meta?.quickW && (
              <div className="flex flex-wrap gap-1">
                {meta.quickW.map((qw) => (
                  <button
                    key={qw}
                    className={`px-1.5 py-0.5 text-[10px] border rounded ${Math.abs(o.widthCm - qw) < 0.5 ? 'border-gold text-gold' : 'border-line text-muted hover:text-text'}`}
                    onClick={() => setObj((x) => { x.widthCm = qw; })}
                    data-testid={`obj-quick-${qw}`}
                  >
                    {qw}
                  </button>
                ))}
              </div>
            )}
            {meta && meta.shapes.length > 1 && (
              <select
                className="field-input text-xs py-1"
                value={o.shape}
                onChange={(e) => setObj((x) => {
                  x.shape = e.target.value as PlacedObject['shape'];
                  if (x.shape === 'lform' && !x.l2) x.l2 = { widthCm: Math.round(x.depthCm), depthCm: Math.round(x.depthCm * 1.2) };
                })}
                data-testid="obj-shape"
              >
                {meta.shapes.map((s) => (
                  <option key={s} value={s}>{t(`shape.${s}`)}</option>
                ))}
              </select>
            )}
            {o.shape === 'lform' && (
              <div className="grid grid-cols-2 gap-1.5">
                {dimInput(t('objects.l2w'), o.l2?.widthCm ?? o.depthCm, (v) => setObj((x) => { x.l2 = { widthCm: v, depthCm: x.l2?.depthCm ?? x.depthCm }; }), 20, 400, 'obj-l2w')}
                {dimInput(t('objects.l2d'), o.l2?.depthCm ?? o.depthCm, (v) => setObj((x) => { x.l2 = { widthCm: x.l2?.widthCm ?? x.depthCm, depthCm: v }; }), 20, 400, 'obj-l2d')}
              </div>
            )}
            {ft?.id.startsWith('kueche') || ft?.id === 'kochinsel' || ft?.id === 'theke' ? (
              <KitchenSegments o={o} setObj={setObj} t={t} />
            ) : null}
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] text-muted flex-1">
                {t('objects.rotation')}
                <input
                  className="field-input text-xs mt-0.5 py-1"
                  key={`${objSelId}-rot-${o.rotationDeg}`}
                  defaultValue={Math.round(o.rotationDeg)}
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v)) setObj((x) => { x.rotationDeg = ((Math.round(v) % 360) + 360) % 360; });
                  }}
                  inputMode="numeric"
                  data-testid="obj-rot"
                />
              </label>
              <select
                className="field-input text-xs py-1 w-24 mt-3"
                value={o.tier}
                onChange={(e) => setObj((x) => { x.tier = e.target.value as PlacedObject['tier']; })}
                data-testid="obj-tier"
              >
                {(['standard', 'premium', 'luxus'] as const).map((tr) => (
                  <option key={tr} value={tr}>{t(`common.tier.${tr}`)}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-1.5 text-[10px] text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={!!o.bestand}
                onChange={(e) => setObj((x) => { x.bestand = e.target.checked; })}
                data-testid="obj-bestand"
              />
              {t('objects.bestand')}
            </label>
            <div className="flex gap-1.5">
              <button
                className="btn btn-ghost flex-1 text-[11px] py-1"
                onClick={() => {
                  const copy: PlacedObject = { ...JSON.parse(JSON.stringify(o)), id: uid('po'), x: o.x + 40, y: o.y + 40 };
                  commit((_fp, _h, r) => {
                    const v = r.variants.find((x) => x.id === r.activeVariantId);
                    if (v) v.placed = [...(v.placed ?? []), copy];
                  });
                  setObjSelId(copy.id);
                }}
                data-testid="obj-duplicate"
              >
                <Copy size={11} /> {t('editor.duplicate')}
              </button>
              <button
                className="btn btn-danger flex-1 text-[11px] py-1"
                onClick={() => {
                  commit((_fp, _h, r) => {
                    const v = r.variants.find((x) => x.id === r.activeVariantId);
                    if (v) v.placed = (v.placed ?? []).filter((x) => x.id !== objSelId);
                  });
                  setObjSelId(null);
                }}
                data-testid="obj-delete"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Erweiterung 8 · T6: Pin bearbeiten */}
      {pinEdit && (() => {
        const pin = (room.pins ?? []).find((p) => p.id === pinEdit);
        if (!pin) return null;
        const setPin = (fn: (p: PlanPin) => void) =>
          commit((_fp, _h, r) => {
            const target = (r.pins ?? []).find((p) => p.id === pinEdit);
            if (target) fn(target);
          });
        return (
          <div className="absolute bottom-1 left-1 right-1 bg-surface/97 border border-line rounded p-2.5 z-10" data-testid="pin-editor">
            <div className="flex items-center gap-2 mb-1.5">
              <select
                className="field-input text-xs py-1 w-28"
                value={pin.category}
                onChange={(e) => setPin((p) => { p.category = e.target.value as PinCategory; })}
              >
                {PIN_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{t(`pin.${c}`)}</option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-[10px] text-muted">
                <input type="checkbox" checked={!!pin.done} onChange={(e) => setPin((p) => { p.done = e.target.checked; })} data-testid="pin-done" />
                {t('pin.done')}
              </label>
              <label className="text-[10px] text-muted cursor-pointer underline">
                {t('pin.photo')}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    compressImage(file, 800).then((dataUrl) => setPin((p) => { p.photo = dataUrl; }));
                  }}
                  data-testid="pin-photo-input"
                />
              </label>
              {pin.photo && <img src={pin.photo} alt="" className="h-8 w-8 object-cover rounded" />}
              <button
                className="text-muted hover:text-danger ml-auto"
                onClick={() => {
                  commit((_fp, _h, r) => { r.pins = (r.pins ?? []).filter((p) => p.id !== pinEdit); });
                  setPinEdit(null);
                }}
                data-testid="pin-delete"
              >
                <X size={13} />
              </button>
            </div>
            <input
              className="field-input text-xs py-1"
              autoFocus
              placeholder={t('pin.textPlaceholder')}
              defaultValue={pin.text}
              onBlur={(e) => setPin((p) => { p.text = e.target.value; })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPin((p) => { p.text = (e.target as HTMLInputElement).value; });
                  setPinEdit(null);
                }
              }}
              data-testid="pin-text"
            />
          </div>
        );
      })()}

      {/* W8: Onboarding / Kürzel-Übersicht (überspringbar) */}
      {showHelp && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded z-10" data-testid="editor-onboarding">
          <div className="card p-4 max-w-sm">
            <p className="eyebrow mb-2">{t('editor.helpTitle')}</p>
            <ul className="text-xs space-y-1.5 text-muted">
              <li><span className="text-text">{t('editor.help1')}</span></li>
              <li><span className="text-text">{t('editor.help2')}</span></li>
              <li><span className="text-text">{t('editor.help3')}</span></li>
              <li><span className="text-text">{t('editor.help4')}</span></li>
              <li className="pt-1 border-t border-line">
                <kbd className="text-gold">W</kbd> {t('editor.toolWall')} · <kbd className="text-gold">M</kbd> {t('editor.toolMeasure')} ·{' '}
                <kbd className="text-gold">D</kbd> {t('editor.duplicate')} · <kbd className="text-gold">Entf</kbd> {t('common.delete')} ·{' '}
                <kbd className="text-gold">Esc</kbd> {t('common.cancel')} · <kbd className="text-gold">Alt</kbd> {t('editor.helpFine')} ·{' '}
                <kbd className="text-gold">Shift</kbd> {t('editor.helpFreeAngle')}
              </li>
            </ul>
            <button className="btn btn-primary w-full mt-4 text-xs py-1.5" onClick={dismissHelp} data-testid="onboarding-dismiss">
              {t('editor.helpOk')}
            </button>
          </div>
        </div>
      )}

      {/* W7: Nordwinkel exakt eingeben (Doppelklick auf den Nordpfeil) */}
      {northEdit && (
        <div className="absolute top-12 right-1 flex items-center gap-1 bg-surface/95 border border-line rounded px-2 py-1" data-testid="north-edit">
          <span className="text-[11px] text-muted">{t('editor.north')} (°):</span>
          <input
            className="field-input text-xs w-16 py-0.5"
            autoFocus
            defaultValue={Math.round(plan.northAngleDeg ?? 0)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const v = Number((e.target as HTMLInputElement).value.replace(',', '.'));
                if (Number.isFinite(v)) {
                  commit((fp) => {
                    fp.northAngleDeg = ((Math.round(v) % 360) + 360) % 360;
                  });
                }
                setNorthEdit(false);
              } else if (e.key === 'Escape') setNorthEdit(false);
            }}
            data-testid="north-edit-input"
          />
        </div>
      )}

      {/* W6: Raum umbenennen (Doppelklick aufs Etikett) */}
      {renaming !== null && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded" data-testid="room-rename">
          <div className="card p-3 flex items-center gap-2">
            <input
              className="field-input text-sm w-48"
              autoFocus
              value={renaming}
              onChange={(e) => setRenaming(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const name = renaming.trim();
                  if (name) commit((_fp, _h, r) => { r.name = name; });
                  setRenaming(null);
                } else if (e.key === 'Escape') setRenaming(null);
              }}
              data-testid="room-rename-input"
            />
            <button
              className="btn btn-primary text-xs py-1.5"
              onClick={() => {
                const name = renaming.trim();
                if (name) commit((_fp, _h, r) => { r.name = name; });
                setRenaming(null);
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Exakte Eck-Eingabe */}
      {selected && editing && (
        <div className="absolute bottom-1 left-1 flex items-center gap-1 bg-surface/95 border border-line rounded px-2 py-1" data-testid="corner-edit">
          <span className="text-[11px] text-muted">
            {editing.side === 'links' ? t('editor.distLeft') : t('editor.distRight')} (m):
          </span>
          <input
            className="field-input text-xs w-20 py-0.5"
            autoFocus
            value={editing.value}
            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const v = Number(editing.value.replace(',', '.'));
                if (Number.isFinite(v) && v >= 0) {
                  const off = offsetFromCorner(plan, selected, editing.side, v * CM_PER_M);
                  setOpening(selected.id, (o) => { o.offsetCm = off; });
                }
                setEditing(null);
              } else if (e.key === 'Escape') setEditing(null);
            }}
            data-testid="corner-edit-input"
          />
        </div>
      )}
    </div>
  );
}

/** Küchen-Baukasten Stufe 2: Segmente der Zeile belegen (Erweiterung 8 · T2). */
function KitchenSegments({
  o, setObj, t,
}: {
  o: PlacedObject;
  setObj: (fn: (obj: PlacedObject) => void) => void;
  t: (k: string) => string;
}) {
  const KINDS = ['spuele', 'kochfeld', 'backofen', 'kuehlschrank', 'geschirrspueler', 'dunstabzug'] as const;
  const segCount = Math.max(1, Math.floor(o.widthCm / 60));
  return (
    <div data-testid="kitchen-segments">
      <p className="text-[10px] text-muted mb-1">{t('objects.segments')} (60-cm-Raster)</p>
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: segCount }, (_, i) => {
          const posCm = i * 60;
          const current = (o.segments ?? []).find((s) => s.posCm === posCm)?.kind;
          return (
            <select
              key={i}
              className={`field-input text-[10px] py-0.5 w-[70px] ${current ? 'border-gold' : ''}`}
              value={current ?? ''}
              onChange={(e) => setObj((x) => {
                const rest = (x.segments ?? []).filter((s) => s.posCm !== posCm);
                x.segments = e.target.value
                  ? [...rest, { posCm, kind: e.target.value as (typeof KINDS)[number] }]
                  : rest;
              })}
              data-testid={`kitchen-seg-${i}`}
            >
              <option value="">–</option>
              {KINDS.map((k) => (
                <option key={k} value={k}>{t(`segment.${k}`)}</option>
              ))}
            </select>
          );
        })}
      </div>
    </div>
  );
}

/** Eigenschaften-Panel für Umriss- und Innenwände (W4). */
function WallPropsPanel({
  plan, selWall, heightCm, commit, onClose, onStartSplit, onDeleteWall, t,
}: {
  plan: Floorplan;
  selWall: number | string;
  heightCm: number;
  commit: (fn: (fp: Floorplan) => void) => void;
  onClose: () => void;
  /** W5: Teilen-Modus für Umriss-Wände starten. */
  onStartSplit: (wallIndex: number) => void;
  /** W5: Umriss-Wand löschen (mit Dialog). */
  onDeleteWall: (wallIndex: number) => void;
  t: (k: string, p?: Record<string, string | number>) => string;
}) {
  const isInner = typeof selWall === 'string';
  const inner = isInner ? (plan.innerWalls ?? []).find((w) => w.id === selWall) : undefined;
  const props = !isInner ? plan.wallProps?.[selWall as number] : undefined;
  if (isInner && !inner) return null;

  const thickness = isInner ? inner!.thicknessCm : (props?.thicknessCm ?? 24);
  const wallType: WallType = isInner ? inner!.wallType : (props?.wallType ?? 'massiv');
  const loadbearing = isInner ? !!inner!.loadbearing : !!props?.loadbearing;

  const update = (fn: (target: { thicknessCm?: number; wallType?: WallType; loadbearing?: boolean; heightCm?: number }) => void) =>
    commit((fp) => {
      if (isInner) {
        const w = (fp.innerWalls ?? []).find((x) => x.id === selWall);
        if (w) fn(w as unknown as { thicknessCm?: number; wallType?: WallType; loadbearing?: boolean; heightCm?: number });
      } else {
        fp.wallProps = { ...(fp.wallProps ?? {}) };
        const cur = { ...(fp.wallProps[selWall as number] ?? {}) };
        fn(cur);
        fp.wallProps[selWall as number] = cur;
      }
    });

  const removeInner = () => {
    if (loadbearing && !window.confirm(t('editor.deleteLoadbearing'))) return;
    commit((fp) => {
      fp.innerWalls = (fp.innerWalls ?? []).filter((w) => w.id !== selWall);
    });
    onClose();
  };

  return (
    <div className="absolute top-8 right-1 bg-surface/95 border border-line rounded p-2.5 w-52 space-y-2" data-testid="wall-props">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium">
          {isInner ? t('editor.innerWall') : `${t('rooms.wall')} ${selWall}`}
          {loadbearing && <span className="text-gold ml-1">· {t('editor.loadbearing')}</span>}
        </p>
        <button className="text-muted hover:text-text" onClick={onClose} aria-label={t('common.cancel')}>
          <X size={12} />
        </button>
      </div>
      <label className="block text-[10px] text-muted">
        {t('editor.thickness')}
        <select
          className="field-input text-xs mt-0.5 py-1"
          value={thickness}
          onChange={(e) => update((w) => { w.thicknessCm = Number(e.target.value); })}
          data-testid="wall-thickness"
        >
          {WALL_THICKNESSES.map((tc) => (
            <option key={tc} value={tc}>{tc.toLocaleString('de-DE')} cm</option>
          ))}
          {!WALL_THICKNESSES.includes(thickness) && <option value={thickness}>{thickness} cm</option>}
        </select>
      </label>
      <label className="block text-[10px] text-muted">
        {t('editor.wallType')}
        <select
          className="field-input text-xs mt-0.5 py-1"
          value={wallType}
          onChange={(e) => update((w) => {
            w.wallType = e.target.value as WallType;
            if (e.target.value === 'halbhoch' && !w.heightCm) w.heightCm = 110;
          })}
          data-testid="wall-type"
        >
          <option value="massiv">{t('wallType.massiv')}</option>
          <option value="trockenbau">{t('wallType.trockenbau')}</option>
          {isInner && <option value="halbhoch">{t('wallType.halbhoch')}</option>}
        </select>
      </label>
      {isInner && wallType === 'halbhoch' && (
        <label className="block text-[10px] text-muted">
          {t('editor.halfHeight')} ({Math.round(inner!.heightCm ?? 110)} cm)
          <input
            type="range" min={90} max={150} step={5}
            className="w-full accent-[#C9A84C]"
            value={inner!.heightCm ?? 110}
            onChange={(e) => update((w) => { w.heightCm = Number(e.target.value); })}
            data-testid="wall-half-height"
          />
        </label>
      )}
      <label className="flex items-center gap-1.5 text-[10px] text-muted cursor-pointer">
        <input
          type="checkbox"
          checked={loadbearing}
          onChange={(e) => update((w) => { w.loadbearing = e.target.checked; })}
          data-testid="wall-loadbearing"
        />
        {t('editor.loadbearing')}
      </label>
      {!isInner && (
        <>
          <p className="text-[9px] text-muted">
            {t('editor.wallArea')}: {(wallLengthCm(plan.points, selWall as number) / CM_PER_M * (heightCm / CM_PER_M)).toFixed(2)} m²
          </p>
          {/* W5: Teilen + Löschen */}
          <div className="flex gap-1.5">
            <button
              className="btn btn-ghost flex-1 text-[11px] py-1"
              onClick={() => onStartSplit(selWall as number)}
              data-testid="wall-split"
            >
              {t('editor.splitWall')}
            </button>
            <button
              className="btn btn-danger flex-1 text-[11px] py-1"
              onClick={() => onDeleteWall(selWall as number)}
              disabled={plan.points.length <= 3}
              data-testid="wall-delete-outer"
            >
              {t('common.delete')}
            </button>
          </div>
        </>
      )}
      {isInner && (
        <button className="btn btn-danger w-full text-[11px] py-1" onClick={removeInner} data-testid="wall-delete">
          {t('common.delete')}
        </button>
      )}
    </div>
  );
}

/** Nächstgelegene Wand (ohne Schwelle) für das Platzieren einer Kopie. */
function nearestWall(pts: Point[], p: Point): number | null {
  let best: { i: number; d: number } | null = null;
  for (let i = 0; i < pts.length; i++) {
    const { s } = projectOntoWall(pts, i, p);
    const len = wallLengthCm(pts, i);
    const clamped = Math.max(0, Math.min(len, s));
    const foot = { x: pts[i].x + ((pts[(i + 1) % pts.length].x - pts[i].x) * clamped) / (len || 1), y: pts[i].y + ((pts[(i + 1) % pts.length].y - pts[i].y) * clamped) / (len || 1) };
    const d = Math.hypot(foot.x - p.x, foot.y - p.y);
    if (!best || d < best.d) best = { i, d };
  }
  return best ? best.i : null;
}

/** Klickbare Maßzahl mit Maßhilfslinie von der Wandecke zur Öffnungskante. */
function CornerLabel({
  plan, pts, o, side, cm, tx, ty, onClick,
}: {
  plan: Floorplan;
  pts: Point[];
  o: Opening;
  side: 'links' | 'rechts';
  cm: number;
  tx: (x: number) => number;
  ty: (y: number) => number;
  onClick: () => void;
}) {
  const a = pts[o.wallIndex % pts.length];
  const b = pts[(o.wallIndex + 1) % pts.length];
  const len = wallLengthCm(plan.points, o.wallIndex) || 1;
  const inward = inwardNormal(pts, o.wallIndex);
  const off = 14; // Maßlinie leicht ins Rauminnere versetzt
  const P = (s: number) => ({
    x: a.x + ((b.x - a.x) * s) / len + inward.x * off,
    y: a.y + ((b.y - a.y) * s) / len + inward.y * off,
  });
  const from = side === 'links' ? P(0) : P(len);
  const to = side === 'links' ? P(o.offsetCm) : P(o.offsetCm + o.widthCm);
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  return (
    <g style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onClick(); }} data-testid={`corner-label-${side}`}>
      <line x1={tx(from.x)} y1={ty(from.y)} x2={tx(to.x)} y2={ty(to.y)} stroke="#C9A84C" strokeWidth={1} />
      <text x={tx(mid.x)} y={ty(mid.y)} fill="#C9A84C" fontSize={10} fontWeight={600} textAnchor="middle" dy={-3}>
        {(cm / CM_PER_M).toFixed(2)} m
      </text>
    </g>
  );
}
