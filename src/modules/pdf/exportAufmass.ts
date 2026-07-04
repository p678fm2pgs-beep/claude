/**
 * HAVEN ATELIER — Aufmaß-PDF (Erweiterung 7 · W7).
 * Technischer Plan für Handwerker: maßstäblich (Maßstab angegeben), Maßketten,
 * Raumnamen + Flächen, Tür-/Fensterpositionen mit Typ/Anschlag/Maßen,
 * behaltene Messungen, Nordpfeil, Raumliste mit Summen. OHNE Preise.
 * Nutzt dieselben Symbol-Daten wie der Editor (planSymbols — eine Quelle).
 */
import { jsPDF } from 'jspdf';
import type { Project, Room, Lang } from '../../types';
import { CM_PER_M, wallLengthCm, deriveAreas } from '../../lib/geometry';
import { openingSymbol, inwardNormal } from '../../lib/planSymbols';
import { polygonCentroid, cornerDistances, pointOnWall } from '../../lib/planEditor';
import { electroSymbol } from '../../lib/electroSymbols';
import { translate } from '../../i18n';

const INK = '#1A1814';
const MUTED = '#6b6256';
const GOLD = '#C9A84C';
const BOARD = '#F6F4EF';

/** Wählt den gröbsten Standard-Maßstab, mit dem der Plan in die Fläche passt. */
export function pickScale(spanXCm: number, spanYCm: number, availWmm: number, availHmm: number): number {
  for (const s of [50, 75, 100, 150, 200]) {
    // Maßstab 1:s → 1 cm Realität = 10/s mm Papier
    const wmm = (spanXCm * 10) / s;
    const hmm = (spanYCm * 10) / s;
    if (wmm <= availWmm && hmm <= availHmm) return s;
  }
  return 200;
}

export function buildAufmassPdf(project: Project, lang: Lang): jsPDF {
  const t = (k: string, p?: Record<string, string | number>) => translate(lang, k, p);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const H = 297;
  const M = 16;

  project.rooms.forEach((room, idx) => {
    if (idx > 0) doc.addPage();
    drawRoomPage(doc, room, project, t, lang, W, H, M);
  });

  // ── Raumliste mit Summen ──
  doc.addPage();
  doc.setFillColor(BOARD);
  doc.rect(0, 0, W, H, 'F');
  header(doc, t('rooms.list'), project, M, W);
  let y = 46;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(MUTED);
  const cols = [M, M + 70, M + 105, M + 140, M + 172];
  for (const [i, h] of [t('rooms.name'), t('rooms.floorArea'), t('rooms.wallArea'), t('rooms.perimeter'), t('rooms.height')].entries()) {
    doc.text(h, cols[i], y);
  }
  y += 2;
  doc.setDrawColor('#D8D4CA');
  doc.line(M, y, W - M, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(INK);
  let sumFloor = 0;
  let sumWall = 0;
  let sumPer = 0;
  for (const room of project.rooms) {
    const d = deriveAreas(room.floorplan, room.heightCm);
    sumFloor += d.floorAreaM2;
    sumWall += d.netWallAreaM2;
    sumPer += d.perimeterM;
    doc.setFontSize(8);
    doc.text(room.name.slice(0, 38), cols[0], y);
    doc.text(`${d.floorAreaM2.toFixed(2)} m²`, cols[1], y);
    doc.text(`${d.netWallAreaM2.toFixed(2)} m²`, cols[2], y);
    doc.text(`${d.perimeterM.toFixed(2)} m`, cols[3], y);
    doc.text(`${(room.heightCm / CM_PER_M).toFixed(2)} m`, cols[4], y);
    y += 5.5;
  }
  doc.setDrawColor(GOLD);
  doc.line(M, y - 3, W - M, y - 3);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(GOLD);
  doc.text(t('rooms.listTotal'), cols[0], y + 1);
  doc.text(`${sumFloor.toFixed(2)} m²`, cols[1], y + 1);
  doc.text(`${sumWall.toFixed(2)} m²`, cols[2], y + 1);
  doc.text(`${sumPer.toFixed(2)} m`, cols[3], y + 1);
  footer(doc, project, t, M, W, H);

  return doc;
}

function header(doc: jsPDF, title: string, project: Project, M: number, W: number): void {
  doc.setTextColor(GOLD);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('H A V E N   A T E L I E R  ·  A U F M A S S', M, 20);
  doc.setTextColor(INK);
  doc.setFont('times', 'normal');
  doc.setFontSize(22);
  doc.text(title, M, 32);
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  doc.text(project.name, W - M, 32, { align: 'right' });
  doc.setDrawColor(GOLD);
  doc.setLineWidth(0.3);
  doc.line(M, 37, W - M, 37);
}

function footer(doc: jsPDF, project: Project, t: (k: string) => string, M: number, _W: number, H: number): void {
  doc.setFontSize(7);
  doc.setTextColor(MUTED);
  doc.text(
    `${project.name} · ${new Date().toLocaleDateString('de-DE')} · ${t('costs.priceDate')}: ${project.priceListDate} — ${t('aufmass.noPrices')}`,
    M,
    H - 10,
  );
}

function drawRoomPage(
  doc: jsPDF,
  room: Room,
  project: Project,
  t: (k: string, p?: Record<string, string | number>) => string,
  lang: Lang,
  W: number,
  H: number,
  M: number,
): void {
  doc.setFillColor(BOARD);
  doc.rect(0, 0, W, H, 'F');
  header(doc, room.name, project, M, W);

  const fp = room.floorplan;
  const pts = fp.points;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const spanX = Math.max(1, Math.max(...xs) - minX);
  const spanY = Math.max(1, Math.max(...ys) - minY);

  const availW = W - 2 * M - 20;
  const availH = 150;
  const scaleDen = pickScale(spanX, spanY, availW, availH);
  const k = 10 / scaleDen; // cm → mm auf Papier
  const ox = M + 12 + (availW - spanX * k) / 2;
  const oy = 48 + (availH - spanY * k) / 2;
  const X = (x: number) => ox + (x - minX) * k;
  const Y = (y: number) => oy + (y - minY) * k;

  // Umriss
  doc.setDrawColor(INK);
  doc.setLineWidth(0.5);
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    doc.line(X(a.x), Y(a.y), X(b.x), Y(b.y));
  }

  // Innenwände
  doc.setLineWidth(0.9);
  doc.setDrawColor('#5C544A');
  for (const iw of fp.innerWalls ?? []) {
    doc.line(X(iw.a.x), Y(iw.a.y), X(iw.b.x), Y(iw.b.y));
  }

  // (Erweiterung 8) FBH-Zonen + Elektro-Symbole (Planungsdaten, ohne Preise)
  const variant = room.variants.find((v) => v.id === room.activeVariantId);
  doc.setLineWidth(0.2);
  for (const z of variant?.heatZones ?? []) {
    doc.setDrawColor('#C16E4F');
    doc.setLineDashPattern([1.5, 1], 0);
    for (let i = 0; i < z.poly.length; i++) {
      const a = z.poly[i];
      const b = z.poly[(i + 1) % z.poly.length];
      doc.line(X(a.x), Y(a.y), X(b.x), Y(b.y));
    }
    doc.setLineDashPattern([], 0);
  }
  doc.setDrawColor('#5A6B5A');
  doc.setLineWidth(0.25);
  for (const el of variant?.electro ?? []) {
    let ex: number;
    let ey: number;
    let angle = 0;
    if (el.wallIndex !== undefined && el.offsetCm !== undefined) {
      const pp = pointOnWall(pts, el.wallIndex, el.offsetCm);
      const inw = inwardNormal(pts, el.wallIndex);
      ex = pp.x + inw.x * 11;
      ey = pp.y + inw.y * 11;
      const a = pts[el.wallIndex];
      const b = pts[(el.wallIndex + 1) % pts.length];
      angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    } else {
      ex = el.x ?? 0;
      ey = el.y ?? 0;
    }
    for (const line of electroSymbol(el.kind, ex, ey, angle)) {
      for (let i = 0; i < line.pts.length - 1; i++) {
        doc.line(X(line.pts[i].x), Y(line.pts[i].y), X(line.pts[i + 1].x), Y(line.pts[i + 1].y));
      }
    }
  }

  // Öffnungen mit korrekten Symbolen (gleiche Quelle wie der Editor)
  doc.setLineWidth(0.3);
  for (const o of fp.openings) {
    const a = pts[o.wallIndex % pts.length];
    const b = pts[(o.wallIndex + 1) % pts.length];
    const inward = inwardNormal(pts, o.wallIndex);
    doc.setDrawColor(o.kind === 'fenster' ? '#5A7488' : o.kind === 'durchbruch' ? '#8C9C8A' : '#B0855B');
    for (const line of openingSymbol(o, a, b, inward)) {
      if (line.style === 'dashed') doc.setLineDashPattern([1.2, 1], 0);
      else doc.setLineDashPattern([], 0);
      for (let i = 0; i < line.pts.length - 1; i++) {
        doc.line(X(line.pts[i].x), Y(line.pts[i].y), X(line.pts[i + 1].x), Y(line.pts[i + 1].y));
      }
    }
  }
  doc.setLineDashPattern([], 0);

  // Maßketten je Wand (außen versetzt)
  doc.setFontSize(7);
  doc.setTextColor(INK);
  doc.setDrawColor(MUTED);
  doc.setLineWidth(0.2);
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const inward = inwardNormal(pts, i);
    const off = -14; // 14 cm außerhalb
    const ax = a.x + inward.x * off;
    const ay = a.y + inward.y * off;
    const bx = b.x + inward.x * off;
    const by = b.y + inward.y * off;
    doc.line(X(ax), Y(ay), X(bx), Y(by));
    const lenM = (wallLengthCm(pts, i) / CM_PER_M).toFixed(2);
    doc.text(`${lenM}`, X((ax + bx) / 2), Y((ay + by) / 2) - 0.8, { align: 'center' });
  }

  // Behaltene Messungen
  doc.setDrawColor(GOLD);
  doc.setTextColor(GOLD);
  for (const m of fp.measurements ?? []) {
    doc.setLineDashPattern([1.5, 1], 0);
    doc.line(X(m.a.x), Y(m.a.y), X(m.b.x), Y(m.b.y));
    doc.setLineDashPattern([], 0);
    const d = (Math.hypot(m.b.x - m.a.x, m.b.y - m.a.y) / CM_PER_M).toFixed(2);
    doc.text(`${d} m`, X((m.a.x + m.b.x) / 2), Y((m.a.y + m.b.y) / 2) - 1, { align: 'center' });
  }

  // Raum-Etikett
  const c = polygonCentroid(pts);
  const d = deriveAreas(fp, room.heightCm);
  doc.setTextColor(INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(room.name, X(c.x), Y(c.y), { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(MUTED);
  doc.text(`${d.floorAreaM2.toFixed(2)} m² · ${d.perimeterM.toFixed(2)} m`, X(c.x), Y(c.y) + 4, { align: 'center' });

  // Nordpfeil (dezent, oben rechts im Planfeld)
  const deg = fp.northAngleDeg ?? 0;
  const ncx = W - M - 10;
  const ncy = 48;
  doc.setDrawColor(MUTED);
  doc.setLineWidth(0.2);
  doc.circle(ncx, ncy, 4);
  const rad = (deg * Math.PI) / 180;
  const tipX = ncx + Math.sin(rad) * 3.4;
  const tipY = ncy - Math.cos(rad) * 3.4;
  doc.setDrawColor(GOLD);
  doc.setLineWidth(0.5);
  doc.line(ncx, ncy, tipX, tipY);
  doc.setFontSize(6);
  doc.setTextColor(MUTED);
  doc.text('N', ncx, ncy - 5.5, { align: 'center' });

  // Maßstab
  doc.setFontSize(8);
  doc.setTextColor(INK);
  doc.text(`${t('aufmass.scale')} 1:${scaleDen}`, M, 46);

  // ── Öffnungs-Tabelle ──
  let y = 210;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(MUTED);
  const cols = [M, M + 26, M + 72, M + 102, M + 128, M + 152, M + 172];
  for (const [i, h] of [
    t('aufmass.colKind'), t('aufmass.colType'), t('aufmass.colHinge'),
    `B (m)`, `H (m)`, t('opening.sill'), t('rooms.wall'),
  ].entries()) {
    doc.text(h, cols[i], y);
  }
  y += 2;
  doc.setDrawColor('#D8D4CA');
  doc.line(M, y, W - M, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(INK);
  doc.setFontSize(7.5);
  for (const o of fp.openings) {
    if (y > H - 24) break;
    const kind = o.kind === 'fenster' ? t('rooms.addWindow') : o.kind === 'durchbruch' ? t('rooms.addPassage') : t('rooms.addDoor');
    const type =
      o.kind === 'tuer' ? t(`doorType.${o.doorType ?? 'dreh'}`) :
      o.kind === 'fenster' ? t(`windowType.${o.windowType ?? 'dreh-kipp'}`) : '—';
    const hinge = o.kind === 'durchbruch' ? '—' :
      `${t(`opening.hinge.${o.hinge ?? 'links'}`)}${o.kind === 'tuer' ? ` · ${(o.opensInward ?? true) ? t('aufmass.inward') : t('aufmass.outward')}` : ''}`;
    const dists = cornerDistances(fp, o);
    doc.text(kind, cols[0], y);
    doc.text(type.slice(0, 26), cols[1], y);
    doc.text(hinge.slice(0, 18), cols[2], y);
    doc.text((o.widthCm / CM_PER_M).toFixed(2), cols[3], y);
    doc.text((o.heightCm / CM_PER_M).toFixed(2), cols[4], y);
    doc.text(o.kind === 'fenster' ? `${o.sillCm} cm` : '—', cols[5], y);
    doc.text(`${o.wallIndex} (${(dists.leftCm / CM_PER_M).toFixed(2)}/${(dists.rightCm / CM_PER_M).toFixed(2)})`, cols[6], y);
    y += 4.5;
  }
  const lang2 = lang; // (Sprachparameter aktuell nur für Zahlenformate reserviert)
  void lang2;

  footer(doc, project, t, M, W, H);
}

export function exportAufmassPdf(project: Project, lang: Lang): void {
  const doc = buildAufmassPdf(project, lang);
  const date = new Date().toISOString().slice(0, 10);
  doc.save(`HAVEN_Aufmass_${project.name.replace(/\s+/g, '_')}_${date}.pdf`);
}
