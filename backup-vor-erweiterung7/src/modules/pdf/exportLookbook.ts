/**
 * HAVEN ATELIER — Editoriales Lookbook + Musterbestell-Liste als PDF (Erweiterung 6 · S12).
 * Kundensicher: ausschließlich VK-freie bzw. Brutto-Angaben, niemals EK/Marge.
 */
import { jsPDF } from 'jspdf';
import type { Project, Lang } from '../../types';
import { computeRoomCost } from '../../lib/projectCost';
import { findTone } from '../../data/colors';
import { findMaterial } from '../../data/materials';
import { textureDataUrl } from '../../lib/texture';
import { buildSampleList } from '../../lib/sampleList';

const GOLD = '#C9A84C';
const INK = '#1A1814';
const MUTED = '#6b6256';
const BOARD = '#F6F4EF';

function eur(n: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === 'de' ? 'de-DE' : 'en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

/** Baut das Lookbook-PDF (Deckblatt + eine Editorial-Seite je Raum + Musterliste). */
export function buildLookbookPdf(project: Project, lang: Lang): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const H = 297;
  const M = 20;

  // ── Deckblatt ──
  doc.setFillColor('#0A0A0B');
  doc.rect(0, 0, W, H, 'F');
  doc.setTextColor(GOLD);
  doc.setFont('times', 'normal');
  doc.setFontSize(42);
  doc.text('HAVEN', W / 2, 105, { align: 'center' });
  doc.setFontSize(15);
  doc.setTextColor('#F5F2EA');
  doc.text(lang === 'de' ? 'Lookbook' : 'Lookbook', W / 2, 120, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(GOLD);
  doc.text(project.name, W / 2, 132, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor('#9A958A');
  doc.text(
    lang === 'de'
      ? 'Interior · Farben · Materialien — kuratiert vom HAVEN Atelier'
      : 'Interiors · colours · materials — curated by the HAVEN atelier',
    W / 2,
    150,
    { align: 'center' },
  );

  // ── Eine Editorial-Seite je Raum ──
  for (const room of project.rooms) {
    const v = room.variants.find((x) => x.id === room.activeVariantId) ?? room.variants[0];
    if (!v) continue;
    doc.addPage();
    doc.setFillColor(BOARD);
    doc.rect(0, 0, W, H, 'F');

    doc.setTextColor(GOLD);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('H A V E N   L O O K B O O K', M, 22);
    doc.setTextColor(INK);
    doc.setFont('times', 'normal');
    doc.setFontSize(26);
    doc.text(`${room.name} — ${v.name}`, M, 34);
    doc.setDrawColor(GOLD);
    doc.setLineWidth(0.3);
    doc.line(M, 39, W - M, 39);

    // Farbpalette
    let y = 50;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(MUTED);
    doc.text(lang === 'de' ? 'FARBKLANG' : 'COLOUR CHORD', M, y);
    y += 4;
    const roles = ['wand', 'decke', 'boden', 'akzent', 'textil'] as const;
    let x = M;
    for (const role of roles) {
      const tone = findTone(v.colorRoles[role]);
      if (!tone) continue;
      doc.setFillColor(tone.hex);
      doc.rect(x, y, 30, 18, 'F');
      doc.setDrawColor('#D8D4CA');
      doc.rect(x, y, 30, 18, 'S');
      doc.setFontSize(6.5);
      doc.setTextColor(INK);
      doc.setFont('helvetica', 'normal');
      doc.text(tone.name.slice(0, 22), x, y + 22);
      doc.setTextColor(MUTED);
      doc.text(tone.ral !== '—' ? tone.ral : tone.ncs, x, y + 26);
      x += 34;
    }
    y += 34;

    // Material-Coupons
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(MUTED);
    doc.text(lang === 'de' ? 'MATERIALITÄT' : 'MATERIALITY', M, y);
    y += 4;
    x = M;
    const mats = v.materials.slice(0, 4);
    for (const sel of mats) {
      const m = findMaterial(sel.materialId);
      if (!m) continue;
      try {
        const img = textureDataUrl(m.texture, 200, 130);
        if (img) doc.addImage(img, 'PNG', x, y, 40, 26);
      } catch {
        doc.setFillColor(m.texture.base);
        doc.rect(x, y, 40, 26, 'F');
      }
      doc.setDrawColor('#D8D4CA');
      doc.rect(x, y, 40, 26, 'S');
      doc.setFontSize(6.5);
      doc.setTextColor(INK);
      doc.setFont('helvetica', 'normal');
      doc.text((lang === 'de' ? m.name : m.nameEn).slice(0, 26), x, y + 30);
      doc.setTextColor(MUTED);
      doc.text(m.subcategory.slice(0, 26), x, y + 34);
      x += 44;
    }
    y += 44;

    // Notiz + Investitionsrahmen (Brutto-Spanne, kundensicher)
    if (v.notes) {
      doc.setFont('times', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(INK);
      const noteLines = doc.splitTextToSize(`„${v.notes}“`, W - 2 * M);
      doc.text(noteLines.slice(0, 4), M, y);
      y += noteLines.slice(0, 4).length * 5 + 6;
    }
    const cost = computeRoomCost(room, project.settings.paintCoverage);
    if (cost.subtotal.max > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(MUTED);
      doc.text(
        `${lang === 'de' ? 'Investitionsrahmen (netto VK)' : 'Investment range (net)'}: ${eur(cost.subtotal.min, lang)} – ${eur(cost.subtotal.max, lang)}`,
        M,
        y,
      );
    }

    doc.setFontSize(6.5);
    doc.setTextColor(MUTED);
    doc.text(
      lang === 'de'
        ? 'Bildschirm-/Druck-Annäherung — verbindlich sind physische Muster und Originalfächer.'
        : 'Screen/print approximation — physical samples and original fan decks are binding.',
      M,
      H - 14,
    );
  }

  // ── Musterbestell-Liste ──
  const rows = buildSampleList(project);
  if (rows.length > 0) {
    doc.addPage();
    doc.setFillColor(BOARD);
    doc.rect(0, 0, W, H, 'F');
    doc.setTextColor(GOLD);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('H A V E N   A T E L I E R', M, 22);
    doc.setTextColor(INK);
    doc.setFont('times', 'normal');
    doc.setFontSize(22);
    doc.text(lang === 'de' ? 'Musterbestell-Liste' : 'Sample order list', M, 34);
    doc.setDrawColor(GOLD);
    doc.line(M, 39, W - M, 39);

    let y = 48;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(MUTED);
    const cols = [M, M + 18, M + 68, M + 118, M + 146];
    const heads =
      lang === 'de'
        ? ['ART', 'NAME', 'REFERENZ', 'RAUM', 'EINSATZ']
        : ['TYPE', 'NAME', 'REFERENCE', 'ROOM', 'USE'];
    heads.forEach((h, i) => doc.text(h, cols[i], y));
    y += 2;
    doc.setDrawColor('#D8D4CA');
    doc.line(M, y, W - M, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    for (const r of rows) {
      if (y > H - 20) {
        doc.addPage();
        doc.setFillColor(BOARD);
        doc.rect(0, 0, W, H, 'F');
        y = 24;
      }
      doc.setTextColor(MUTED);
      doc.text(r.art === 'material' ? (lang === 'de' ? 'Material' : 'Material') : lang === 'de' ? 'Farbton' : 'Tone', cols[0], y);
      doc.setTextColor(INK);
      doc.text(r.name.slice(0, 34), cols[1], y);
      doc.setTextColor(MUTED);
      doc.text(r.referenz.slice(0, 32), cols[2], y);
      doc.text(r.raum.slice(0, 18), cols[3], y);
      doc.text(`${r.einsatz}${r.ausfuehrung ? ` · ${r.ausfuehrung}` : ''}`.slice(0, 28), cols[4], y);
      y += 5.5;
    }
  }

  return doc;
}

export function exportLookbookPdf(project: Project, lang: Lang): void {
  const doc = buildLookbookPdf(project, lang);
  const date = new Date().toISOString().slice(0, 10);
  doc.save(`HAVEN_Lookbook_${project.name.replace(/\s+/g, '_')}_${date}.pdf`);
}
