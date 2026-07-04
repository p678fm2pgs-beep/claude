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
import { compareVariants } from '../../lib/variantCompare';
import { translate } from '../../i18n';

/** (Erweiterung 8 · T7/T8) Export-Optionen für den Lookbook-Aufbau. */
export interface LookbookOptions {
  /** Vergleichs-Doppelseite je Raum mit ≥ 2 Varianten. */
  compare?: boolean;
  /** Freigabe-Schlussseite (mit ggf. digitaler Unterschrift). */
  approval?: boolean;
  /** Expertensicht (mit Margen) — sonst reine VK-Kundensicht. */
  internal?: boolean;
}

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
export function buildLookbookPdf(project: Project, lang: Lang, opts: LookbookOptions = {}): jsPDF {
  const t = (k: string, p?: Record<string, string | number>) => translate(lang, k, p);
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

  // ── T7: Varianten-Vergleich (Räume mit ≥ 2 Varianten) ──
  if (opts.compare) {
    for (const room of project.rooms) {
      if (room.variants.length < 2) continue;
      const cmp = compareVariants(room, room.variants[0].id, room.variants[1].id, project.settings.paintCoverage, lang);
      if (!cmp) continue;
      doc.addPage();
      doc.setFillColor(BOARD);
      doc.rect(0, 0, W, H, 'F');
      doc.setTextColor(GOLD);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('H A V E N   L O O K B O O K', M, 22);
      doc.setTextColor(INK);
      doc.setFont('times', 'normal');
      doc.setFontSize(22);
      doc.text(`${room.name} — ${t('compare.title')}`, M, 34);
      doc.setDrawColor(GOLD);
      doc.line(M, 39, W - M, 39);

      const colW = (W - 2 * M - 10) / 2;
      [cmp.a, cmp.b].forEach((s, i) => {
        const x = M + i * (colW + 10);
        doc.setFillColor('#FFFFFF');
        doc.rect(x, 48, colW, 90, 'F');
        doc.setDrawColor('#D8D4CA');
        doc.rect(x, 48, colW, 90, 'S');
        doc.setFont('times', 'normal');
        doc.setFontSize(15);
        doc.setTextColor(INK);
        doc.text(`${t('compare.variant')} ${s.name}`, x + 5, 60);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(MUTED);
        let yy = 70;
        for (const cm of s.coreMaterials) {
          doc.text(`· ${cm}`.slice(0, 40), x + 5, yy);
          yy += 5;
        }
        doc.setFontSize(13);
        doc.setTextColor(GOLD);
        doc.text(`${eur(s.vkMin, lang)} – ${eur(s.vkMax, lang)}`, x + 5, 128);
        if (opts.internal) {
          doc.setFontSize(7);
          doc.setTextColor(MUTED);
          doc.text(`EK: ${eur(s.ekMin, lang)} – ${eur(s.ekMax, lang)}`, x + 5, 134);
        }
      });

      // Preis-Differenz prominent
      doc.setFillColor('#0A0A0B');
      doc.rect(M, 148, W - 2 * M, 26, 'F');
      doc.setTextColor(GOLD);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(t('compare.priceDiff'), M + 6, 158);
      doc.setFont('times', 'normal');
      doc.setFontSize(20);
      doc.setTextColor('#F5F2EA');
      const sign = cmp.diffMid >= 0 ? '+' : '−';
      doc.text(`${sign} ${eur(Math.abs(cmp.diffMid), lang)}`, M + 6, 170);
      doc.setFontSize(8);
      doc.setTextColor(MUTED);
      doc.text(t('compare.diffNote'), W - M - 6, 170, { align: 'right' });
    }
  }

  // ── T8: Freigabe-Seite ──
  if (opts.approval) {
    doc.addPage();
    doc.setFillColor(BOARD);
    doc.rect(0, 0, W, H, 'F');
    doc.setTextColor(GOLD);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('H A V E N   A T E L I E R', M, 22);
    doc.setTextColor(INK);
    doc.setFont('times', 'normal');
    doc.setFontSize(24);
    doc.text(t('approval.title'), M, 36);
    doc.setDrawColor(GOLD);
    doc.line(M, 42, W - M, 42);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(INK);
    doc.text(`${t('approval.project')}: ${project.name}`, M, 56);
    // Gesamtsumme VK über alle Räume (Kundensicht)
    let gMin = 0;
    let gMax = 0;
    for (const room of project.rooms) {
      const c = computeRoomCost(room, project.settings.paintCoverage);
      gMin += c.subtotal.min;
      gMax += c.subtotal.max;
    }
    doc.setFontSize(13);
    doc.setTextColor(GOLD);
    doc.text(`${t('approval.sum')}: ${eur(gMin, lang)} – ${eur(gMax, lang)}`, M, 68);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(MUTED);
    const body = doc.splitTextToSize(t('approval.body'), W - 2 * M);
    doc.text(body, M, 82);
    doc.setFontSize(7.5);
    doc.setTextColor('#C8553D');
    doc.text(t('approval.legalNote'), M, 104);

    // Unterschrift (falls vorhanden) + Felder
    const approvalsList = project.approvals ?? [];
    const appr = approvalsList[approvalsList.length - 1];
    const sigY = 150;
    for (const [i, who] of [t('approval.customer'), t('approval.haven')].entries()) {
      const x = M + i * ((W - 2 * M) / 2 + 4);
      const boxW = (W - 2 * M) / 2 - 4;
      if (i === 0 && appr?.signaturePng) {
        try {
          doc.addImage(appr.signaturePng, 'PNG', x, sigY - 26, boxW, 24);
        } catch {
          /* ignore */
        }
      }
      doc.setDrawColor(INK);
      doc.setLineWidth(0.3);
      doc.line(x, sigY, x + boxW, sigY);
      doc.setFontSize(8);
      doc.setTextColor(MUTED);
      doc.text(who, x, sigY + 5);
      if (i === 0 && appr) {
        doc.setFontSize(7);
        doc.text(`${t('approval.signedAt')}: ${new Date(appr.timestamp).toLocaleString('de-DE')}`, x, sigY + 10);
      }
    }
    doc.setFontSize(8);
    doc.setTextColor(MUTED);
    doc.text(`${t('approval.date')}: ${new Date().toLocaleDateString('de-DE')}`, M, sigY + 24);
  }

  return doc;
}

export function exportLookbookPdf(project: Project, lang: Lang, opts: LookbookOptions = {}): void {
  const doc = buildLookbookPdf(project, lang, opts);
  const date = new Date().toISOString().slice(0, 10);
  doc.save(`HAVEN_Lookbook_${project.name.replace(/\s+/g, '_')}_${date}.pdf`);
}
