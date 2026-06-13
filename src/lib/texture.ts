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
