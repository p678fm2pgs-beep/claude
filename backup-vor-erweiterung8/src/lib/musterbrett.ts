/**
 * HAVEN ATELIER — Digitales Musterbrett (Erweiterung 6 · S9).
 * Rendert die aktive Variante als Musterbrett auf Canvas (helle Board-Fläche,
 * große Material-Coupons, Farb-Chips mit Namen/Codes, Metall & Textil) und
 * exportiert es als PNG. Reine Zeichenlogik — testbar ohne UI.
 */
import type { Room, Variant, ColorRole } from '../types';
import { resolveSurfaceSelection, resolveMaterial } from './materialResolve';
import { drawTexture } from './texture';
import { findTone } from '../data/colors';
import { findMaterial } from '../data/materials';

export const BOARD_W = 1200;
export const BOARD_H = 850;

const INK = '#1A1814';
const MUTED = '#6b6256';
const GOLD = '#C9A84C';
const BOARD_BG = '#F6F4EF';

const ROLE_ORDER: ColorRole[] = ['wand', 'decke', 'boden', 'akzent', 'textil'];

export interface BoardItem {
  kind: 'material' | 'tone';
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub: string;
  /** materialId oder toneId. */
  refId: string;
}

/**
 * Berechnet das Layout des Musterbretts (pur, ohne Canvas):
 * links zwei große Coupons (Boden/Wand), rechts Metall+Textil,
 * darunter eine Chip-Reihe der Farbrollen.
 */
export function computeBoardLayout(variant: Variant, lang: 'de' | 'en'): BoardItem[] {
  const items: BoardItem[] = [];
  const pad = 56;
  const couponW = 320;
  const couponH = 300;
  const topY = 150;

  const floorSel = resolveSurfaceSelection(variant, 'boden');
  const floorMat = resolveMaterial(floorSel);
  if (floorMat) {
    items.push({
      kind: 'material', x: pad, y: topY, w: couponW, h: couponH,
      label: lang === 'de' ? floorMat.name : floorMat.nameEn,
      sub: `Boden · ${floorMat.subcategory}`,
      refId: floorMat.id,
    });
  }
  const wallSel = resolveSurfaceSelection(variant, 'wand');
  const wallMat = resolveMaterial(wallSel);
  if (wallMat) {
    items.push({
      kind: 'material', x: pad + couponW + 32, y: topY, w: couponW, h: couponH,
      label: lang === 'de' ? wallMat.name : wallMat.nameEn,
      sub: `Wand · ${wallMat.subcategory}`,
      refId: wallMat.id,
    });
  }

  // Sonstige Auswahlen (Metall, Textil …) als halbe Coupons rechts.
  const extras = variant.materials.filter((s) => s.surface === 'sonstiges').slice(0, 2);
  extras.forEach((s, i) => {
    const m = findMaterial(s.materialId);
    if (!m) return;
    items.push({
      kind: 'material',
      x: pad + 2 * (couponW + 32), y: topY + i * (couponH / 2 + 20), w: couponW, h: couponH / 2 - 10,
      label: lang === 'de' ? m.name : m.nameEn,
      sub: m.subcategory,
      refId: m.id,
    });
  });

  // Farb-Chips unten in Rollen-Reihenfolge.
  const chipW = 190;
  const chipH = 150;
  let cx = pad;
  const cy = topY + couponH + 90;
  for (const role of ROLE_ORDER) {
    const toneId = variant.colorRoles[role];
    const tone = findTone(toneId);
    if (!tone) continue;
    items.push({
      kind: 'tone', x: cx, y: cy, w: chipW, h: chipH,
      label: tone.name,
      sub: `${role.charAt(0).toUpperCase() + role.slice(1)} · ${tone.ral !== '—' ? tone.ral : tone.ncs} · LRV ${tone.lrv}`,
      refId: tone.id,
    });
    cx += chipW + 24;
  }
  return items;
}

/** Zeichnet das komplette Musterbrett in den übergebenen Canvas. */
export function drawMusterbrett(
  canvas: HTMLCanvasElement,
  room: Room,
  variant: Variant,
  lang: 'de' | 'en',
): void {
  canvas.width = BOARD_W;
  canvas.height = BOARD_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Fläche
  ctx.fillStyle = BOARD_BG;
  ctx.fillRect(0, 0, BOARD_W, BOARD_H);

  // Kopf
  ctx.fillStyle = GOLD;
  ctx.font = '600 13px Montserrat, sans-serif';
  ctx.fillText('H A V E N   A T E L I E R  ·  M U S T E R B R E T T', 56, 60);
  ctx.fillStyle = INK;
  ctx.font = '500 34px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(`${room.name} — ${variant.name}`, 56, 104);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(56, 122);
  ctx.lineTo(BOARD_W - 56, 122);
  ctx.stroke();

  for (const item of computeBoardLayout(variant, lang)) {
    // Coupon-Schatten + Rahmen
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(item.x + 4, item.y + 6, item.w, item.h);
    ctx.restore();

    if (item.kind === 'material') {
      const m = findMaterial(item.refId);
      if (m) {
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.beginPath();
        ctx.rect(0, 0, item.w, item.h);
        ctx.clip();
        drawTexture(ctx, item.w, item.h, m.texture, m.id);
        ctx.restore();
      }
    } else {
      const tone = findTone(item.refId);
      ctx.fillStyle = tone?.hex ?? '#999999';
      ctx.fillRect(item.x, item.y, item.w, item.h);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(item.x, item.y, item.w, item.h);

    // Beschriftung unterhalb
    ctx.fillStyle = INK;
    ctx.font = '600 14px Montserrat, sans-serif';
    ctx.fillText(item.label, item.x, item.y + item.h + 24);
    ctx.fillStyle = MUTED;
    ctx.font = '400 11px Montserrat, sans-serif';
    ctx.fillText(item.sub, item.x, item.y + item.h + 42);
  }

  // Fuß mit Ehrlichkeits-Hinweis
  ctx.fillStyle = MUTED;
  ctx.font = '400 10px Montserrat, sans-serif';
  ctx.fillText(
    lang === 'de'
      ? 'Bildschirm-Annäherung — verbindlich sind ausschließlich physische Muster und Original-Farbfächer.'
      : 'Screen approximation — only physical samples and original fan decks are binding.',
    56,
    BOARD_H - 32,
  );
}

/** Exportiert den Canvas als PNG-Download. */
export function exportBoardPng(canvas: HTMLCanvasElement, filename: string): void {
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}
