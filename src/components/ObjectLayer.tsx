/**
 * HAVEN ATELIER — Einrichtungs-Ebene im Grundriss-Editor (Erweiterung 8 · T1/T2).
 * Rendert platzierte Objekte (Draufsichtsymbole), Auswahl mit Skalier-Griffen +
 * Rotationsgriff, Verschieben mit Live-Abständen zu Wänden/Nachbarn (Warnfärbung
 * < 60 cm), Wanddocking, Teppich-Ebene unter Möbeln. Reine Schale um lib/objects.
 */
import { useRef, useState } from 'react';
import type { Floorplan, PlacedObject, Point, Room, Variant } from '../types';
import { findFurnitureType } from '../data/furniture';
import { objectSymbol } from '../lib/objectSymbols';
import {
  objectFootprint,
  bbox,
  nearestWallDistances,
  nearestNeighborDistances,
  snapObjectPosition,
  snapRotation,
  resizeByHandle,
  CLEARANCE_WARN_CM,
  type HandleId,
} from '../lib/objects';
import { projectOntoWall, pointOnWall } from '../lib/planEditor';
import { wallLengthCm, CM_PER_M } from '../lib/geometry';

const HANDLES: HandleId[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

interface DragState {
  id: string;
  mode: 'move' | 'resize' | 'rotate';
  handle?: HandleId;
  /** Versatz Zeiger→Mittelpunkt beim Move. */
  grabDx: number;
  grabDy: number;
  live: PlacedObject;
  active: boolean;
  timer?: ReturnType<typeof setTimeout>;
}

export function ObjectLayer({
  room,
  variant,
  commit,
  tx,
  ty,
  toWorld,
  scale,
  selectedId,
  setSelectedId,
  showDims,
  cursorPos,
  placingTypeId,
  interactive,
}: {
  room: Room;
  variant: Variant;
  commit: (fn: (fp: Floorplan, setHeight: (h: number) => void, room: Room) => void) => void;
  tx: (x: number) => number;
  ty: (y: number) => number;
  toWorld: (e: { clientX: number; clientY: number }) => Point;
  scale: number;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  showDims: boolean;
  cursorPos: Point | null;
  /** Katalogtyp, der gerade platziert wird (Geist am Cursor). */
  placingTypeId: string | null;
  /** false im Wand-/Mess-Werkzeug: Objekte nicht anfassbar. */
  interactive: boolean;
}) {
  const drag = useRef<DragState | null>(null);
  const [, tick] = useState(0);
  const rerender = () => tick((n) => n + 1);

  const placed = variant.placed ?? [];
  const fp = room.floorplan;
  const setPlaced = (id: string, fn: (o: PlacedObject) => void) =>
    commit((_fp, _h, r) => {
      const v = r.variants.find((x) => x.id === r.activeVariantId);
      const o = v?.placed?.find((x) => x.id === id);
      if (o) fn(o);
    });

  /** Wanddocking: Position auf die nächste Wand projizieren + Rotation an Wand ausrichten. */
  const dockToWall = (o: PlacedObject): PlacedObject => {
    let best: { i: number; dist: number; s: number } | null = null;
    for (let i = 0; i < fp.points.length; i++) {
      const { s, distCm } = projectOntoWall(fp.points, i, { x: o.x, y: o.y });
      const len = wallLengthCm(fp.points, i);
      if (s < 0 || s > len) continue;
      if (!best || distCm < best.dist) best = { i, dist: distCm, s };
    }
    if (!best || best.dist > 120) return o;
    const a = fp.points[best.i];
    const b = fp.points[(best.i + 1) % fp.points.length];
    const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    // Innenseite: Mittelpunkt depth/2 von der Wand entfernt
    const sign = inwardSign(fp.points, best.i);
    const foot = pointOnWall(fp.points, best.i, Math.max(o.widthCm / 2, Math.min(wallLengthCm(fp.points, best.i) - o.widthCm / 2, best.s)));
    const n = wallNormal(fp.points, best.i, sign);
    return {
      ...o,
      x: foot.x + n.x * (o.depthCm / 2),
      y: foot.y + n.y * (o.depthCm / 2),
      rotationDeg: ((Math.round(angle) % 360) + 360) % 360,
    };
  };

  const startDrag = (e: React.PointerEvent, o: PlacedObject, mode: DragState['mode'], handle?: HandleId) => {
    if (!interactive) return;
    e.stopPropagation();
    setSelectedId(o.id);
    const w = toWorld(e);
    const st: DragState = {
      id: o.id,
      mode,
      handle,
      grabDx: o.x - w.x,
      grabDy: o.y - w.y,
      live: { ...o },
      active: e.pointerType !== 'touch',
    };
    if (e.pointerType === 'touch') {
      st.timer = setTimeout(() => {
        st.active = true;
        rerender();
      }, 300);
    }
    drag.current = st;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    const st = drag.current;
    if (!st || !st.active) return;
    const w = toWorld(e);
    const src = placed.find((x) => x.id === st.id);
    if (!src) return;
    const meta = findFurnitureType(src.typeId)?.place;
    if (st.mode === 'move') {
      let next: PlacedObject = { ...src, x: w.x + st.grabDx, y: w.y + st.grabDy };
      if (meta?.wallDock) next = dockToWall(next);
      else {
        const snapped = snapObjectPosition(fp, next, placed, e.altKey);
        next = { ...next, ...snapped };
      }
      st.live = next;
    } else if (st.mode === 'resize' && st.handle) {
      const limits = {
        minW: meta?.minW ?? 20,
        maxW: meta?.maxW ?? 600,
        minD: meta?.minD ?? 20,
        maxD: meta?.maxD ?? 600,
      };
      const dims = resizeByHandle(st.live, st.handle, w, limits, e.shiftKey);
      st.live = { ...st.live, ...dims };
    } else if (st.mode === 'rotate') {
      const deg = (Math.atan2(w.y - st.live.y, w.x - st.live.x) * 180) / Math.PI + 90;
      st.live = { ...st.live, rotationDeg: snapRotation(deg, e.shiftKey) };
    }
    rerender();
  };

  const onUp = () => {
    const st = drag.current;
    drag.current = null;
    if (!st) return;
    if (st.timer) clearTimeout(st.timer);
    if (!st.active) return;
    const live = st.live;
    setPlaced(st.id, (o) => {
      o.x = live.x;
      o.y = live.y;
      o.rotationDeg = live.rotationDeg;
      o.widthCm = live.widthCm;
      o.depthCm = live.depthCm;
    });
  };

  const liveOf = (o: PlacedObject): PlacedObject =>
    drag.current?.active && drag.current.id === o.id ? drag.current.live : o;

  // Zeichnungsreihenfolge: Teppiche zuerst (liegen UNTER Möbeln)
  const ordered = [...placed].sort((a, b) => {
    const la = (a.layer ?? (findFurnitureType(a.typeId)?.place?.rugLayer ? 'teppich' : 'moebel')) === 'teppich' ? 0 : 1;
    const lb = (b.layer ?? (findFurnitureType(b.typeId)?.place?.rugLayer ? 'teppich' : 'moebel')) === 'teppich' ? 0 : 1;
    return la - lb;
  });

  // Platzier-Geist
  const ghostType = placingTypeId ? findFurnitureType(placingTypeId) : null;

  return (
    <g
      onPointerMove={onMove}
      onPointerUp={onUp}
      data-testid="object-layer"
    >
      {ordered.map((raw) => {
        const o = liveOf(raw);
        const ft = findFurnitureType(o.typeId);
        const isSel = o.id === selectedId;
        const dragging = drag.current?.active && drag.current.id === o.id;
        const lines = objectSymbol(o, ft?.place);
        const color = o.bestand ? '#8C9C8A' : isSel ? '#C9A84C' : '#4A443C';
        const fb = bbox(objectFootprint(o));
        const wallD = dragging || isSel ? nearestWallDistances(fp, o) : [];
        const nbD = dragging ? nearestNeighborDistances(o, placed.map(liveOf)) : [];
        return (
          <g key={o.id}>
            {/* Symbol */}
            <polygon
              points={objectFootprint(o).map((p) => `${tx(p.x)},${ty(p.y)}`).join(' ')}
              fill={o.bestand ? 'rgba(140,156,138,0.10)' : isSel ? 'rgba(201,168,76,0.10)' : 'rgba(0,0,0,0.03)'}
              stroke="none"
              style={{ cursor: interactive ? 'move' : 'default' }}
              onPointerDown={(e) => startDrag(e, raw, 'move')}
              data-testid={`pobj-${o.id}`}
            />
            {lines.map((l, i) => (
              <polyline
                key={i}
                points={l.pts.map((p) => `${tx(p.x)},${ty(p.y)}`).join(' ')}
                fill="none"
                stroke={color}
                strokeWidth={l.style === 'solid' ? 1.5 : 0.9}
                strokeDasharray={l.style === 'dashed' ? '4 3' : undefined}
                opacity={l.style === 'thin' ? 0.7 : 1}
                pointerEvents="none"
              />
            ))}
            {o.bestand && (
              <text x={tx(o.x)} y={ty(o.y)} fill="#8C9C8A" fontSize={8} textAnchor="middle" pointerEvents="none">
                Bestand
              </text>
            )}

            {/* Maße am Objekt */}
            {(showDims || isSel) && (
              <g pointerEvents="none">
                <text x={tx((fb.minX + fb.maxX) / 2)} y={ty(fb.minY) - 4} fill="#6b6256" fontSize={9} textAnchor="middle">
                  {(o.widthCm / CM_PER_M).toFixed(2).replace('.', ',')} m
                </text>
                <text
                  x={tx(fb.minX) - 4}
                  y={ty((fb.minY + fb.maxY) / 2)}
                  fill="#6b6256"
                  fontSize={9}
                  textAnchor="middle"
                  transform={`rotate(-90 ${tx(fb.minX) - 4} ${ty((fb.minY + fb.maxY) / 2)})`}
                >
                  {(o.depthCm / CM_PER_M).toFixed(2).replace('.', ',')} m
                </text>
              </g>
            )}

            {/* Live-Abstände zu Wänden (Warnfärbung < 60 cm) */}
            {wallD.map((wd, i) => {
              const warn = wd.distCm < CLEARANCE_WARN_CM && wd.distCm > 1;
              return (
                <g key={i} pointerEvents="none" data-testid={warn ? 'dist-warn' : 'dist-ok'}>
                  <line x1={tx(wd.from.x)} y1={ty(wd.from.y)} x2={tx(wd.to.x)} y2={ty(wd.to.y)} stroke={warn ? '#C8553D' : '#C9A84C'} strokeWidth={1} strokeDasharray="3 2" />
                  <text
                    x={(tx(wd.from.x) + tx(wd.to.x)) / 2}
                    y={(ty(wd.from.y) + ty(wd.to.y)) / 2}
                    fill={warn ? '#C8553D' : '#C9A84C'}
                    fontSize={9}
                    fontWeight={600}
                    textAnchor="middle"
                    dy={-2}
                  >
                    {(wd.distCm / CM_PER_M).toFixed(2).replace('.', ',')}
                  </text>
                </g>
              );
            })}
            {nbD.map((nd, i) => {
              const other = placed.find((x) => x.id === nd.otherId);
              if (!other) return null;
              const warn = nd.distCm < CLEARANCE_WARN_CM;
              return (
                <text
                  key={`nb${i}`}
                  x={(tx(o.x) + tx(other.x)) / 2}
                  y={(ty(o.y) + ty(other.y)) / 2}
                  fill={warn ? '#C8553D' : '#9A958A'}
                  fontSize={9}
                  fontWeight={600}
                  textAnchor="middle"
                  pointerEvents="none"
                >
                  {(nd.distCm / CM_PER_M).toFixed(2).replace('.', ',')}
                </text>
              );
            })}

            {/* Griffe (Skalieren) + Rotationsgriff */}
            {isSel && interactive && !dragging && (
              <g>
                {HANDLES.map((h) => {
                  const hx = h.includes('e') ? fb.maxX : h.includes('w') ? fb.minX : (fb.minX + fb.maxX) / 2;
                  const hy = h.includes('s') ? fb.maxY : h.includes('n') ? fb.minY : (fb.minY + fb.maxY) / 2;
                  if (h.length === 1 && ((h === 'n' || h === 's') ? fb.maxX - fb.minX < 30 : fb.maxY - fb.minY < 30)) return null;
                  return (
                    <rect
                      key={h}
                      x={tx(hx) - 5}
                      y={ty(hy) - 5}
                      width={10}
                      height={10}
                      fill="#C9A84C"
                      stroke="#0A0A0B"
                      strokeWidth={0.8}
                      style={{ cursor: `${h}-resize` }}
                      onPointerDown={(e) => startDrag(e, raw, 'resize', h)}
                      data-testid={`handle-${h}`}
                    />
                  );
                })}
                <circle
                  cx={tx((fb.minX + fb.maxX) / 2)}
                  cy={ty(fb.minY) - 16}
                  r={6}
                  fill="#C9A84C"
                  stroke="#0A0A0B"
                  strokeWidth={0.8}
                  style={{ cursor: 'grab' }}
                  onPointerDown={(e) => startDrag(e, raw, 'rotate')}
                  data-testid="handle-rotate"
                />
                <line
                  x1={tx((fb.minX + fb.maxX) / 2)}
                  y1={ty(fb.minY)}
                  x2={tx((fb.minX + fb.maxX) / 2)}
                  y2={ty(fb.minY) - 10}
                  stroke="#C9A84C"
                  strokeWidth={1}
                  pointerEvents="none"
                />
              </g>
            )}
          </g>
        );
      })}

      {/* Geist beim Platzieren aus dem Katalog */}
      {ghostType?.place && cursorPos && (() => {
        const m = ghostType.place;
        const ghost: PlacedObject = {
          id: 'ghost', typeId: ghostType.id, x: cursorPos.x, y: cursorPos.y, rotationDeg: 0,
          widthCm: m.defaultW, depthCm: m.defaultD, heightCm: m.defaultH,
          shape: m.shapes[0], tier: 'premium',
          ...(m.shapes[0] === 'lform' ? { l2: { widthCm: Math.round(m.defaultD), depthCm: Math.round(m.defaultD * 1.2) } } : {}),
        };
        const docked = m.wallDock ? dockToWall(ghost) : ghost;
        return (
          <polygon
            points={objectFootprint(docked).map((p) => `${tx(p.x)},${ty(p.y)}`).join(' ')}
            fill="rgba(201,168,76,0.12)"
            stroke="#C9A84C"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            pointerEvents="none"
            data-testid="object-ghost"
          />
        );
      })()}
      <span style={{ display: 'none' }}>{scale}</span>
    </g>
  );
}

/** Platzieren beim Klick (vom PlanEditor aufgerufen). */
export function placeObjectAt(
  typeId: string,
  at: Point,
  newId: string,
): PlacedObject | null {
  const ft = findFurnitureType(typeId);
  const m = ft?.place;
  if (!ft || !m) return null;
  const o: PlacedObject = {
    id: newId,
    typeId,
    x: at.x,
    y: at.y,
    rotationDeg: 0,
    widthCm: m.defaultW,
    depthCm: m.defaultD,
    heightCm: m.defaultH,
    shape: m.shapes[0],
    tier: 'premium',
    ...(m.shapes[0] === 'lform' ? { l2: { widthCm: Math.round(m.defaultD), depthCm: Math.round(m.defaultD * 1.2) } } : {}),
    ...(m.rugLayer ? { layer: 'teppich' as const } : {}),
  };
  return o;
}

function inwardSign(points: Point[], _wallIndex: number): number {
  let s = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    s += a.x * b.y - b.x * a.y;
  }
  return s > 0 ? 1 : -1;
}

function wallNormal(points: Point[], wallIndex: number, sign: number): Point {
  const a = points[wallIndex];
  const b = points[(wallIndex + 1) % points.length];
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: (-(b.y - a.y) / len) * sign, y: ((b.x - a.x) / len) * sign };
}
