import { useEffect, useRef } from 'react';
import type { Room, Variant } from '../types';
import { wallLengthCm } from '../lib/geometry';
import { fillFloorSurface } from '../lib/texture';
import { resolveFloorSelection, resolveMaterial, resolveWallColorHex } from '../lib/materialResolve';
import { findFixture } from '../data/lighting';

/**
 * Erweiterung 4 — „Realistische Ansicht" (2D-Draufsicht mit Materialien/Farben).
 * Rein additiv: ersetzt NICHT den technischen Plan (MiniPlan), sondern ergänzt ihn.
 */
export function RealisticPlan({
  room,
  variant,
  width = 560,
  height = 380,
  showDimensions = false,
}: {
  room: Room;
  variant: Variant;
  width?: number;
  height?: number;
  showDimensions?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = 2;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const pts = room.floorplan.points;
    if (pts.length < 3) return;

    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    const pad = 30;
    const spanX = Math.max(1, maxX - minX);
    const spanY = Math.max(1, maxY - minY);
    const scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY); // px / cm
    const ox = pad + (width - pad * 2 - spanX * scale) / 2;
    const oy = pad + (height - pad * 2 - spanY * scale) / 2;
    const tx = (x: number) => ox + (x - minX) * scale;
    const ty = (y: number) => oy + (y - minY) * scale;
    const pxPerM = scale * 100;

    // Hintergrund (helle Boardfläche)
    ctx.fillStyle = '#F6F4EF';
    ctx.fillRect(0, 0, width, height);

    // ── Boden: Polygon clippen und Material/Muster füllen ──
    const floorSel = resolveFloorSelection(variant);
    const floorMat = resolveMaterial(floorSel);
    ctx.save();
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(tx(p.x), ty(p.y)) : ctx.lineTo(tx(p.x), ty(p.y))));
    ctx.closePath();
    ctx.clip();
    if (floorMat) {
      fillFloorSurface(ctx, { minX: tx(minX), minY: ty(minY), maxX: tx(maxX), maxY: ty(maxY) }, pxPerM, {
        texture: floorMat.texture,
        pattern: floorSel?.pattern,
        direction: floorSel?.layingDirection,
        groutColor: floorSel?.groutColor,
      });
    } else {
      // Fallback: dezente neutrale Bodenfarbe (nie leer, nie knallig).
      ctx.fillStyle = '#E7E2D7';
      ctx.fillRect(tx(minX), ty(minY), tx(maxX) - tx(minX), ty(maxY) - ty(minY));
    }
    ctx.restore();

    // ── Voute-/indirektes Licht: weicher heller Saum entlang der Wände ──
    const hasVoute = (variant.lights ?? []).some((l) => {
      const fx = findFixture(l.fixtureId);
      return fx?.voute;
    });
    if (hasVoute) {
      ctx.save();
      ctx.beginPath();
      pts.forEach((p, i) => (i === 0 ? ctx.moveTo(tx(p.x), ty(p.y)) : ctx.lineTo(tx(p.x), ty(p.y))));
      ctx.closePath();
      ctx.clip();
      ctx.lineJoin = 'round';
      for (let k = 0; k < 5; k++) {
        ctx.strokeStyle = `rgba(255, 246, 214, ${0.16 - k * 0.028})`;
        ctx.lineWidth = 6 + k * 7;
        ctx.beginPath();
        pts.forEach((p, i) => (i === 0 ? ctx.moveTo(tx(p.x), ty(p.y)) : ctx.lineTo(tx(p.x), ty(p.y))));
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
    }

    // ── Wände: pro Wand Farbe/Material als Stärke-Streifen ──
    const wallPx = Math.max(6, 0.12 * pxPerM); // 12 cm Wandstärke
    ctx.lineCap = 'butt';
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const color = resolveWallColorHex(variant, i);
      ctx.strokeStyle = color;
      ctx.lineWidth = wallPx;
      ctx.beginPath();
      ctx.moveTo(tx(a.x), ty(a.y));
      ctx.lineTo(tx(b.x), ty(b.y));
      ctx.stroke();
    }

    // ── Türen & Fenster ──
    for (const o of room.floorplan.openings) {
      const a = pts[o.wallIndex % pts.length];
      const b = pts[(o.wallIndex + 1) % pts.length];
      const len = wallLengthCm(pts, o.wallIndex) || 1;
      const t0 = o.offsetCm / len;
      const t1 = Math.min(1, (o.offsetCm + o.widthCm) / len);
      const x0 = tx(a.x + (b.x - a.x) * t0);
      const y0 = ty(a.y + (b.y - a.y) * t0);
      const x1 = tx(a.x + (b.x - a.x) * t1);
      const y1 = ty(a.y + (b.y - a.y) * t1);

      // Wandöffnung „ausstanzen" (Boardfarbe), damit Symbol sauber sitzt
      ctx.strokeStyle = '#F6F4EF';
      ctx.lineWidth = wallPx + 2;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();

      const frame = o.frameColor ?? (o.kind === 'fenster' ? '#5A7488' : '#B0855B');
      if (o.kind === 'fenster') {
        // Mehrfachlinie (Rahmen + Glas)
        const nx = -(y1 - y0);
        const ny = x1 - x0;
        const nl = Math.hypot(nx, ny) || 1;
        const ux = (nx / nl) * (wallPx / 3);
        const uy = (ny / nl) * (wallPx / 3);
        ctx.strokeStyle = frame;
        ctx.lineWidth = 1.5;
        for (const m of [-1, 0, 1]) {
          ctx.beginPath();
          ctx.moveTo(x0 + ux * m, y0 + uy * m);
          ctx.lineTo(x1 + ux * m, y1 + uy * m);
          ctx.stroke();
        }
      } else {
        // Tür: Blatt + Öffnungsbogen
        const dx = x1 - x0;
        const dy = y1 - y0;
        const wlen = Math.hypot(dx, dy);
        const ang = Math.atan2(dy, dx);
        ctx.strokeStyle = frame;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + Math.cos(ang - Math.PI / 2) * wlen, y0 + Math.sin(ang - Math.PI / 2) * wlen);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(176,133,91,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x0, y0, wlen, ang - Math.PI / 2, ang);
        ctx.stroke();
      }
    }

    // ── Lichtsymbole (Spots als Punkte mittig, Streifen als Linie) ──
    const lights = variant.lights ?? [];
    if (lights.some((l) => findFixture(l.fixtureId)?.category === 'einbau')) {
      const cx = tx((minX + maxX) / 2);
      const cy = ty((minY + maxY) / 2);
      const r = Math.min(tx(maxX) - tx(minX), ty(maxY) - ty(minY)) * 0.28;
      ctx.fillStyle = 'rgba(201,168,76,0.85)';
      for (let s = 0; s < 4; s++) {
        const ang = (s / 4) * Math.PI * 2 + Math.PI / 4;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── optionale Bemaßung (wie technischer Plan) ──
    if (showDimensions) {
      ctx.fillStyle = '#6b6256';
      ctx.font = '10px Montserrat, sans-serif';
      ctx.textAlign = 'center';
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const mx = tx((a.x + b.x) / 2);
        const my = ty((a.y + b.y) / 2);
        ctx.fillText(`${(wallLengthCm(pts, i) / 100).toFixed(2)} m`, mx, my - 4);
      }
    }
  }, [room, variant, width, height, showDimensions]);

  return (
    <canvas
      ref={ref}
      style={{ width, height, maxWidth: '100%' }}
      data-testid="realistic-plan"
      role="img"
      aria-label="Realistische 2D-Ansicht"
    />
  );
}
