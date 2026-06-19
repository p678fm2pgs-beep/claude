/**
 * HAVEN ATELIER — Programmatischer Textur-Generator (Fallback-Pflicht, Abschnitt 9).
 * Erzeugt deterministisch hochwertige neutrale Texturen je Materialton —
 * die App zeigt nie ein leeres Bild. Wird für UI-Kacheln und PDF genutzt.
 */
import type { Texture, TextureVariant } from '../data/materials';
import { hexToRgb, rgbToHex } from './color';

/** Deterministischer Pseudo-Zufall (Mulberry32). */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shade(hex: string, amt: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({ r: r + amt, g: g + amt, b: b + amt });
}

export function drawTexture(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  texture: Texture,
  seedKey = '',
): void {
  const rand = rng(hashStr(texture.base + texture.variant + seedKey));
  const base = texture.base;
  const grain = texture.grain ?? shade(base, -24);

  // Grundgradient für Tiefe.
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, shade(base, 8));
  g.addColorStop(1, shade(base, -8));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const draw = TEXTURE_PAINTERS[texture.variant];
  draw(ctx, w, h, base, grain, rand);

  // Feines Rauschen.
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < (w * h) / 90; i++) {
    const x = rand() * w;
    const y = rand() * h;
    ctx.fillStyle = rand() > 0.5 ? '#ffffff' : '#000000';
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.globalAlpha = 1;
}

type Painter = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  base: string,
  grain: string,
  rand: () => number,
) => void;

const TEXTURE_PAINTERS: Record<TextureVariant, Painter> = {
  wood(ctx, w, h, base, grain, rand) {
    const planks = 4;
    const pw = w / planks;
    for (let p = 0; p < planks; p++) {
      ctx.fillStyle = shade(base, (rand() - 0.5) * 18);
      ctx.fillRect(p * pw, 0, pw, h);
      ctx.strokeStyle = shade(grain, -10);
      ctx.lineWidth = 1;
      for (let i = 0; i < 14; i++) {
        const x = p * pw + rand() * pw;
        ctx.globalAlpha = 0.12 + rand() * 0.15;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(x + (rand() - 0.5) * 6, h / 3, x + (rand() - 0.5) * 6, (2 * h) / 3, x, h);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = shade(base, -28);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p * pw, 0);
      ctx.lineTo(p * pw, h);
      ctx.stroke();
    }
  },
  stone(ctx, w, h, _base, grain, rand) {
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = shade(grain, rand() * 20);
      ctx.globalAlpha = 0.18;
      ctx.lineWidth = 1 + rand() * 2;
      ctx.beginPath();
      let x = rand() * w;
      let y = 0;
      ctx.moveTo(x, y);
      while (y < h) {
        x += (rand() - 0.5) * 30;
        y += 8 + rand() * 14;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },
  tile(ctx, w, h, base, grain, rand) {
    const cols = 2;
    const rows = 2;
    const tw = w / cols;
    const th = h / rows;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = shade(base, (rand() - 0.5) * 10);
        ctx.fillRect(c * tw + 1, r * th + 1, tw - 2, th - 2);
      }
    ctx.strokeStyle = shade(grain, -6);
    ctx.lineWidth = 2;
    for (let c = 1; c < cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * tw, 0);
      ctx.lineTo(c * tw, h);
      ctx.stroke();
    }
    for (let r = 1; r < rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * th);
      ctx.lineTo(w, r * th);
      ctx.stroke();
    }
  },
  plaster(ctx, w, h, base, _grain, rand) {
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = shade(base, (rand() - 0.5) * 22);
      ctx.globalAlpha = 0.15;
      const x = rand() * w;
      const y = rand() * h;
      const r = 6 + rand() * 24;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.7, rand() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
  textile(ctx, w, h, _base, grain, _rand) {
    ctx.strokeStyle = shade(grain, 6);
    ctx.globalAlpha = 0.16;
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 3) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 3) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },
  carpet(ctx, w, h, base, grain, rand) {
    for (let i = 0; i < (w * h) / 40; i++) {
      ctx.fillStyle = shade(base, (rand() - 0.5) * 26);
      ctx.globalAlpha = 0.25;
      ctx.fillRect(rand() * w, rand() * h, 2, 3);
    }
    ctx.globalAlpha = 1;
    void grain;
  },
  metal(ctx, w, h, base, _grain, _rand) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, shade(base, 30));
    g.addColorStop(0.45, base);
    g.addColorStop(0.55, shade(base, 18));
    g.addColorStop(1, shade(base, -22));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = shade(base, 28);
    ctx.globalAlpha = 0.18;
    for (let y = 0; y < h; y += 2) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },
  solid(ctx, w, h, base, _grain, _rand) {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
  },
};

// ─────────────────────────────────────────────────────────────
// Erweiterung 4: maßstäbliches Verlegemuster-Rendering (additiv).
// Zeichnet das Bodenmuster in den aktuellen Clip (Raumpolygon) des Kontexts.
// Alles prozedural & offline; Basisfarbe füllt dahinter → niemals leer/Lego.
// ─────────────────────────────────────────────────────────────

export interface FloorPatternOptions {
  pattern: string; // LayingPattern
  direction?: 'laengs' | 'quer' | 'diagonal';
  base: string;
  grain: string;
  /** Fliesenraster statt Holz (Material mit variant 'tile'/'stone'). */
  tile?: boolean;
  groutColor?: string;
  /** Kantenlänge eines Elements in Metern (Diele-Länge bzw. Fliesenformat). */
  unitM?: number;
}

function withShade(hex: string, amt: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({ r: r + amt, g: g + amt, b: b + amt });
}

/** Eine Diele/ein Element als gefülltes (ggf. rotiertes) Rechteck mit Maserung. */
function plank(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  lenPx: number,
  widPx: number,
  angle: number,
  base: string,
  grain: string,
  rand: () => number,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.fillStyle = withShade(base, (rand() - 0.5) * 16);
  ctx.fillRect(-lenPx / 2, -widPx / 2, lenPx, widPx);
  // Maserung
  ctx.strokeStyle = withShade(grain, -6);
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = 1;
  const lines = Math.max(1, Math.round(widPx / 6));
  for (let i = 0; i < lines; i++) {
    const y = -widPx / 2 + (i + 0.5) * (widPx / lines) + (rand() - 0.5) * 2;
    ctx.beginPath();
    ctx.moveTo(-lenPx / 2, y);
    ctx.lineTo(lenPx / 2, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Fuge/Kante
  ctx.strokeStyle = withShade(base, -34);
  ctx.lineWidth = 1;
  ctx.strokeRect(-lenPx / 2, -widPx / 2, lenPx, widPx);
  ctx.restore();
}

/**
 * Füllt den aktuellen Clip mit dem Bodenmuster.
 * bbox in Geräte-px, pxPerM = Pixel pro Meter (Maßstab).
 */
export function fillFloorPattern(
  ctx: CanvasRenderingContext2D,
  bbox: { minX: number; minY: number; maxX: number; maxY: number },
  pxPerM: number,
  opts: FloorPatternOptions,
): void {
  const rand = rng(hashStr(opts.base + opts.pattern + (opts.direction ?? '')));
  const { minX, minY, maxX, maxY } = bbox;
  const W = maxX - minX;
  const H = maxY - minY;

  // Basisfüllung (verhindert jegliche Lücken → nie „leer").
  ctx.fillStyle = opts.base;
  ctx.fillRect(minX, minY, W, H);

  if (opts.tile) {
    fillTileGrid(ctx, bbox, pxPerM, opts, rand);
    return;
  }

  const p = opts.pattern;
  if (p === 'fischgraet') fillHerringbone(ctx, bbox, pxPerM, opts, rand);
  else if (p === 'chevron') fillChevron(ctx, bbox, pxPerM, opts, rand);
  else if (p === 'wuerfel' || p === 'mosaik' || p === 'flechtmuster') fillBasketWeave(ctx, bbox, pxPerM, opts, rand);
  else fillPlanks(ctx, bbox, pxPerM, opts, rand);
  void H;
}

function fillPlanks(
  ctx: CanvasRenderingContext2D,
  { minX, minY, maxX, maxY }: { minX: number; minY: number; maxX: number; maxY: number },
  pxPerM: number,
  opts: FloorPatternOptions,
  rand: () => number,
): void {
  const diagonal = opts.direction === 'diagonal' || opts.pattern === 'diagonal';
  const quer = opts.direction === 'quer';
  const lenPx = (opts.unitM ?? 1.2) * pxPerM;
  const widPx = 0.18 * pxPerM;
  const stagger = opts.pattern === 'schiffsboden' ? lenPx / 3 : lenPx / 2;
  ctx.save();
  if (diagonal) {
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.translate(-cx, -cy);
  }
  const angle = quer ? Math.PI / 2 : 0;
  const rowH = quer ? lenPx : widPx;
  const pad = Math.max(lenPx, widPx) * 1.5;
  let row = 0;
  for (let y = minY - pad; y < maxY + pad; y += rowH) {
    const off = (row % 2 === 0 ? 0 : stagger) + (quer ? 0 : 0);
    const colW = quer ? widPx : lenPx;
    for (let x = minX - pad + (off % colW) - colW; x < maxX + pad; x += colW) {
      const cx = x + colW / 2;
      const cy = y + rowH / 2;
      if (quer) plank(ctx, cx, cy, lenPx, widPx, angle, opts.base, opts.grain, rand);
      else plank(ctx, cx, cy, lenPx, widPx, 0, opts.base, opts.grain, rand);
    }
    row++;
  }
  ctx.restore();
}

function fillHerringbone(
  ctx: CanvasRenderingContext2D,
  { minX, minY, maxX, maxY }: { minX: number; minY: number; maxX: number; maxY: number },
  pxPerM: number,
  opts: FloorPatternOptions,
  rand: () => number,
): void {
  // ±45°-Dielen auf versetztem Gitter (Basisfüllung dahinter → keine Lücken).
  const lenPx = (opts.unitM ?? 0.6) * pxPerM;
  const widPx = lenPx / 5;
  const s = (lenPx + widPx) / Math.SQRT2; // Gitterabstand
  const halfDiag = (lenPx / 2) / Math.SQRT2;
  const pad = lenPx;
  for (let j = -1; ; j++) {
    const baseY = minY - pad + j * s;
    if (baseY > maxY + pad) break;
    for (let i = -1; ; i++) {
      const baseX = minX - pad + i * s;
      if (baseX > maxX + pad) break;
      // Plank A (+45°) und Plank B (−45°) bilden den Zickzack.
      plank(ctx, baseX, baseY, lenPx, widPx, Math.PI / 4, opts.base, opts.grain, rand);
      plank(ctx, baseX + halfDiag, baseY + halfDiag, lenPx, widPx, -Math.PI / 4, opts.base, opts.grain, rand);
    }
  }
}

function fillChevron(
  ctx: CanvasRenderingContext2D,
  { minX, minY, maxX, maxY }: { minX: number; minY: number; maxX: number; maxY: number },
  pxPerM: number,
  opts: FloorPatternOptions,
  rand: () => number,
): void {
  // Spalten von Parallelogramm-Dielen, Steigung alterniert → durchgehendes V.
  const lenPx = (opts.unitM ?? 0.6) * pxPerM;
  const widPx = lenPx / 5;
  const colW = lenPx * Math.cos(Math.PI / 4);
  const pad = lenPx;
  let col = 0;
  for (let x = minX - pad; x < maxX + pad; x += colW) {
    const angle = col % 2 === 0 ? -Math.PI / 4 : Math.PI / 4;
    const cx = x + colW / 2;
    for (let y = minY - pad; y < maxY + pad; y += widPx / Math.cos(Math.PI / 4)) {
      plank(ctx, cx, y, lenPx, widPx, angle, opts.base, opts.grain, rand);
    }
    col++;
  }
}

function fillBasketWeave(
  ctx: CanvasRenderingContext2D,
  { minX, minY, maxX, maxY }: { minX: number; minY: number; maxX: number; maxY: number },
  pxPerM: number,
  opts: FloorPatternOptions,
  rand: () => number,
): void {
  const cell = (opts.unitM ?? 0.4) * pxPerM;
  const widPx = cell / 4;
  let row = 0;
  for (let y = minY; y < maxY; y += cell) {
    let colN = 0;
    for (let x = minX; x < maxX; x += cell) {
      const horizontal = (row + colN) % 2 === 0;
      const cx = x + cell / 2;
      const cy = y + cell / 2;
      const n = 3;
      for (let k = 0; k < n; k++) {
        const off = (k - (n - 1) / 2) * (widPx + 1);
        if (horizontal) plank(ctx, cx, cy + off, cell - 2, widPx, 0, opts.base, opts.grain, rand);
        else plank(ctx, cx + off, cy, cell - 2, widPx, Math.PI / 2, opts.base, opts.grain, rand);
      }
      colN++;
    }
    row++;
  }
}

function fillTileGrid(
  ctx: CanvasRenderingContext2D,
  { minX, minY, maxX, maxY }: { minX: number; minY: number; maxX: number; maxY: number },
  pxPerM: number,
  opts: FloorPatternOptions,
  rand: () => number,
): void {
  const sizePx = (opts.unitM ?? 0.6) * pxPerM;
  const grout = opts.groutColor ?? withShade(opts.base, -28);
  for (let y = minY; y < maxY; y += sizePx) {
    for (let x = minX; x < maxX; x += sizePx) {
      ctx.fillStyle = withShade(opts.base, (rand() - 0.5) * 10);
      ctx.fillRect(x + 1, y + 1, sizePx - 2, sizePx - 2);
      // dezente Steinstruktur
      ctx.strokeStyle = withShade(opts.grain, rand() * 14);
      ctx.globalAlpha = 0.1;
      ctx.lineWidth = 1;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.moveTo(x + rand() * sizePx, y);
        ctx.lineTo(x + rand() * sizePx, y + sizePx);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }
  // Fugen
  ctx.strokeStyle = grout;
  ctx.lineWidth = Math.max(1.5, sizePx * 0.03);
  for (let y = minY; y <= maxY; y += sizePx) {
    ctx.beginPath();
    ctx.moveTo(minX, y);
    ctx.lineTo(maxX, y);
    ctx.stroke();
  }
  for (let x = minX; x <= maxX; x += sizePx) {
    ctx.beginPath();
    ctx.moveTo(x, minY);
    ctx.lineTo(x, maxY);
    ctx.stroke();
  }
}

/** Erzeugt eine Data-URL der Textur (für PDF / <img>). */
export function textureDataUrl(texture: Texture, w = 240, h = 160): string {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  drawTexture(ctx, w, h, texture);
  return canvas.toDataURL('image/png');
}
