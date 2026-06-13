/**
 * HAVEN ATELIER — PDF-Export (Kunden- & internes Kalkulations-PDF).
 * jsPDF mit eingebetteten Standard-Fonts (Times/Helvetica) und druckscharfen Swatches.
 */
import { jsPDF } from 'jspdf';
import type { Project } from '../../types';
import { computeProjectCost } from '../../lib/projectCost';
import { getActiveVariant } from '../roomHelpers';
import { findTone } from '../../data/colors';
import { findMaterial } from '../../data/materials';
import { deriveAreas, wallLengthCm, CM_PER_M } from '../../lib/geometry';
import { textureDataUrl } from '../../lib/texture';
import { translate } from '../../i18n';
import type { Lang } from '../../types';

const GOLD = '#C9A84C';
const INK = '#1A1814';
const MUTED = '#6b6256';

interface Options {
  internal: boolean;
  lang: Lang;
}

function eur(n: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === 'de' ? 'de-DE' : 'en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

export function buildPdf(project: Project, opts: Options): jsPDF {
  const { internal, lang } = opts;
  const t = (k: string, p?: Record<string, string | number>) => translate(lang, k, p);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const H = 297;
  const M = 18;

  // ── Deckblatt ──
  doc.setFillColor('#0A0A0B');
  doc.rect(0, 0, W, H, 'F');
  doc.setTextColor(GOLD);
  doc.setFont('times', 'normal');
  doc.setFontSize(40);
  doc.text('HAVEN', W / 2, 110, { align: 'center' });
  doc.setFontSize(14);
  doc.setTextColor('#F5F2EA');
  doc.text(t('app.tagline'), W / 2, 124, { align: 'center' });
  doc.setDrawColor(GOLD);
  doc.setLineWidth(0.3);
  doc.line(W / 2 - 30, 132, W / 2 + 30, 132);
  doc.setFontSize(18);
  doc.text(project.name, W / 2, 150, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor('#9A958A');
  if (project.customer) doc.text(project.customer, W / 2, 160, { align: 'center' });
  if (project.address) doc.text(project.address, W / 2, 166, { align: 'center' });
  doc.text(new Date().toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB'), W / 2, 176, { align: 'center' });
  if (internal) {
    doc.setTextColor(GOLD);
    doc.setFontSize(9);
    doc.text('INTERN · KALKULATION (EK / MARGE)', W / 2, 280, { align: 'center' });
  }

  const cost = computeProjectCost(project);

  // ── Pro Raum eine Board-Seite ──
  for (const room of project.rooms) {
    doc.addPage();
    const variant = getActiveVariant(room);
    const d = deriveAreas(room.floorplan, room.heightCm);
    let y = M;

    doc.setTextColor(GOLD);
    doc.setFontSize(8);
    doc.text(project.name.toUpperCase(), M, y);
    doc.setTextColor(INK);
    doc.setFont('times', 'normal');
    doc.setFontSize(24);
    y += 10;
    doc.text(room.name, M, y);
    doc.setFontSize(9);
    doc.setTextColor(MUTED);
    doc.setFont('helvetica', 'normal');
    y += 6;
    doc.text(
      `${t(`roomType.${room.type}`)} · ${variant?.name ?? ''} · ${d.floorAreaM2.toFixed(2)} m² · ${(room.heightCm / 100).toFixed(2)} m`,
      M,
      y,
    );
    y += 8;

    // Farbpalette
    if (variant && Object.keys(variant.colorRoles).length > 0) {
      doc.setTextColor(GOLD);
      doc.setFontSize(8);
      doc.text(t('board.palette').toUpperCase(), M, y);
      y += 4;
      let x = M;
      for (const [role, toneId] of Object.entries(variant.colorRoles)) {
        const tone = findTone(toneId);
        if (!tone) continue;
        doc.setFillColor(tone.hex);
        doc.setDrawColor('#cccccc');
        doc.rect(x, y, 28, 16, 'FD');
        doc.setTextColor(INK);
        doc.setFontSize(6.5);
        doc.text(tone.name, x, y + 20);
        doc.setTextColor(MUTED);
        doc.text(`${tone.ral}`, x, y + 23);
        doc.text(`${t(`colors.role.${role}`)} · LRV ${tone.lrv}`, x, y + 26);
        x += 32;
        if (x > W - 30) {
          x = M;
          y += 30;
        }
      }
      y += 32;
    }

    // Materialien (Texturkacheln)
    if (variant && variant.materials.length > 0) {
      doc.setTextColor(GOLD);
      doc.setFontSize(8);
      doc.text(t('board.materials').toUpperCase(), M, y);
      y += 4;
      let x = M;
      for (const sel of variant.materials.slice(0, 6)) {
        const m = findMaterial(sel.materialId);
        if (!m) continue;
        const img = textureDataUrl(m.texture, 200, 130);
        if (img) doc.addImage(img, 'PNG', x, y, 28, 18);
        doc.setTextColor(INK);
        doc.setFontSize(6.5);
        doc.text((lang === 'de' ? m.name : m.nameEn).slice(0, 22), x, y + 22);
        x += 32;
        if (x > W - 30) {
          x = M;
          y += 28;
        }
      }
      y += 28;
    }

    // Mini-Grundriss
    drawPlan(doc, room, W - M - 60, M + 16, 60, 44);

    // Möbel
    if (variant && variant.furniture.length > 0) {
      doc.setTextColor(GOLD);
      doc.setFontSize(8);
      doc.text(t('board.furniture').toUpperCase(), M, y);
      y += 5;
      doc.setTextColor(INK);
      doc.setFontSize(8);
      for (const f of variant.furniture) {
        doc.text(`· ${f.label} (${f.quantity} ${f.unit})`, M, y);
        y += 4.5;
      }
      y += 3;
    }

    // Kostenblock des Raums
    const rc = cost.rooms.find((r) => r.roomId === room.id);
    if (rc) {
      doc.setDrawColor('#dddddd');
      doc.line(M, y, W - M, y);
      y += 6;
      doc.setTextColor(GOLD);
      doc.setFontSize(8);
      doc.text(t('board.costs').toUpperCase(), M, y);
      doc.setTextColor(INK);
      doc.setFontSize(9);
      const sub =
        rc.subtotal.min === rc.subtotal.max
          ? eur(rc.subtotal.min, lang)
          : `${eur(rc.subtotal.min, lang)} – ${eur(rc.subtotal.max, lang)}`;
      doc.text(`${t('costs.roomSubtotal')}: ${sub}`, M + 40, y);
    }

    footer(doc, project, lang, internal);
  }

  // ── Projekt-Kostenübersicht ──
  doc.addPage();
  let y = M;
  doc.setTextColor(GOLD);
  doc.setFontSize(8);
  doc.text(project.name.toUpperCase(), M, y);
  doc.setTextColor(INK);
  doc.setFont('times', 'normal');
  doc.setFontSize(22);
  y += 10;
  doc.text(t('costs.title'), M, y);
  y += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const lineRow = (label: string, value: string, strong = false) => {
    doc.setTextColor(strong ? INK : MUTED);
    if (strong) doc.setFont('helvetica', 'bold');
    doc.text(label, M, y);
    doc.text(value, W - M, y, { align: 'right' });
    if (strong) doc.setFont('helvetica', 'normal');
    y += 7;
  };

  const rng = (min: number, max: number) => (min === max ? eur(min, lang) : `${eur(min, lang)} – ${eur(max, lang)}`);
  lineRow(t('costs.projectSum'), rng(cost.baseSubtotal.min, cost.baseSubtotal.max));
  lineRow(cost.fee.label, eur((cost.fee.totalMin + cost.fee.totalMax) / 2, lang));
  lineRow(cost.reserve.label, eur((cost.reserve.totalMin + cost.reserve.totalMax) / 2, lang));
  doc.setDrawColor('#dddddd');
  doc.line(M, y - 2, W - M, y - 2);
  y += 3;
  lineRow(t('costs.net'), rng(cost.net.min, cost.net.max), true);
  lineRow(t('costs.vat'), rng(cost.vat.min, cost.vat.max));
  lineRow(t('costs.gross'), rng(cost.gross.min, cost.gross.max), true);

  if (internal) {
    y += 4;
    doc.setDrawColor(GOLD);
    doc.line(M, y - 2, W - M, y - 2);
    y += 3;
    lineRow(t('costs.ek'), rng(cost.ekTotal.min, cost.ekTotal.max));
    lineRow(
      t('costs.margin'),
      rng(cost.baseSubtotal.min - cost.ekTotal.max, cost.baseSubtotal.max - cost.ekTotal.min),
    );
  }
  footer(doc, project, lang, internal);

  // ── Abschlussseite mit Disclaimern ──
  doc.addPage();
  y = M + 10;
  doc.setTextColor(GOLD);
  doc.setFont('times', 'normal');
  doc.setFontSize(18);
  doc.text(t('app.tagline'), W / 2, 40, { align: 'center' });
  doc.setTextColor(INK);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  y = 70;
  const wrap = (text: string) => {
    const lines = doc.splitTextToSize(text, W - 2 * M);
    doc.text(lines, M, y);
    y += lines.length * 5 + 6;
  };
  wrap(t('costs.disclaimer') + ` (${t('costs.priceDate')}: ${project.priceListDate})`);
  wrap(t('colors.honesty'));
  footer(doc, project, lang, internal);

  return doc;
}

function drawPlan(doc: jsPDF, room: Project['rooms'][number], x: number, y: number, w: number, h: number): void {
  const pts = room.floorplan.points;
  if (pts.length < 3) return;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const spanX = Math.max(1, Math.max(...xs) - minX);
  const spanY = Math.max(1, Math.max(...ys) - minY);
  const scale = Math.min(w / spanX, h / spanY);
  doc.setDrawColor(INK);
  doc.setLineWidth(0.4);
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    doc.line(x + (a.x - minX) * scale, y + (a.y - minY) * scale, x + (b.x - minX) * scale, y + (b.y - minY) * scale);
    const mx = x + ((a.x + b.x) / 2 - minX) * scale;
    const my = y + ((a.y + b.y) / 2 - minY) * scale;
    doc.setFontSize(5.5);
    doc.setTextColor(MUTED);
    doc.text(`${(wallLengthCm(pts, i) / CM_PER_M).toFixed(2)}`, mx, my);
  }
}

function footer(doc: jsPDF, project: Project, lang: Lang, internal: boolean): void {
  const t = (k: string, p?: Record<string, string | number>) => translate(lang, k, p);
  doc.setFontSize(7);
  doc.setTextColor(MUTED);
  doc.text(
    `HAVEN ATELIER · ${t('costs.priceDate')}: ${project.priceListDate}${internal ? ' · INTERN' : ''}`,
    18,
    290,
  );
}

export function exportProjectPdf(project: Project, internal: boolean, lang: Lang): void {
  const doc = buildPdf(project, { internal, lang });
  const date = new Date().toISOString().slice(0, 10);
  const kind = internal ? 'Kalkulation' : 'Moodboard';
  doc.save(`HAVEN_${kind}_${project.name.replace(/\s+/g, '_')}_${date}.pdf`);
}
