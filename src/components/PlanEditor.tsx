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
import type { Floorplan, Opening, Point, Room } from '../types';
import { CM_PER_M, wallLengthCm } from '../lib/geometry';
import { openingSymbol, inwardNormal } from '../lib/planSymbols';
import {
  dragOpeningTo,
  wallSwitchCandidate,
  cornerDistances,
  offsetFromCorner,
  clampOpeningOffset,
  projectOntoWall,
} from '../lib/planEditor';
import { useT } from '../hooks';
import { uid } from '../lib/id';
import { Copy, X } from 'lucide-react';

const PAD = 30;

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
}: {
  room: Room;
  commit: (fn: (fp: Floorplan) => void) => void;
  width?: number;
  height?: number;
}) {
  const t = useT();
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
      setPlacing(null);
      setGhost(null);
      setSelectedId(null);
      setEditing(null);
    } else if ((e.key === 'd' || e.key === 'D') && selectedId) {
      duplicate();
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
      commit((fp) => {
        fp.openings = fp.openings.filter((o) => o.id !== selectedId);
      });
      setSelectedId(null);
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
        onPointerDown={() => {
          if (!placing) {
            setSelectedId(null);
            setEditing(null);
          }
        }}
        data-testid="floorplan-svg"
      >
        <polygon points={poly} fill="rgba(0,0,0,0.04)" stroke="#1A1814" strokeWidth={2} />

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
