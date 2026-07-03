/**
 * HAVEN ATELIER — Architektur-Plansymbole (Erweiterung 7 · W1).
 * Reine Geometrie: liefert für jede Öffnung die korrekten Symbol-Linien in
 * WELT-Koordinaten (cm). Von PlanEditor UND Aufmaß-PDF genutzt — eine Quelle.
 * Bögen werden als Polylinien angenähert, damit jeder Renderer (SVG/PDF) sie
 * ohne eigene Bogenlogik zeichnen kann.
 */
import type { Opening, Point } from '../types';

export type SymbolStyle = 'solid' | 'thin' | 'dashed';

export interface SymbolLine {
  pts: Point[];
  style: SymbolStyle;
}

/** Vorzeichenbehaftete Polygonfläche (Shoelace, cm²). */
function signedArea(points: Point[]): number {
  let s = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    s += a.x * b.y - b.x * a.y;
  }
  return s / 2;
}

/** Einheitsvektor + Länge einer Wand. */
function wallFrame(a: Point, b: Point): { u: Point; len: number } {
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { u: { x: (b.x - a.x) / len, y: (b.y - a.y) / len }, len };
}

/**
 * Nach INNEN zeigende Normale der Wand i (Heuristik über Flächenvorzeichen —
 * exakt für alle einfach durchlaufenen Polygone, unabhängig von der Windung).
 */
export function inwardNormal(points: Point[], wallIndex: number): Point {
  const a = points[wallIndex % points.length];
  const b = points[(wallIndex + 1) % points.length];
  const { u } = wallFrame(a, b);
  // Bei positiver Shoelace-Summe (Bildschirm-Koordinaten, y nach unten) liegt
  // das Innere in Richtung rot90(u) = (−u.y, u.x); sonst gespiegelt.
  const sign = signedArea(points) > 0 ? 1 : -1;
  return { x: -u.y * sign, y: u.x * sign };
}

/** Viertelbogen als Polylinie (16 Segmente). */
function arc(center: Point, radius: number, fromRad: number, toRad: number): Point[] {
  const pts: Point[] = [];
  const N = 16;
  for (let i = 0; i <= N; i++) {
    const t = fromRad + ((toRad - fromRad) * i) / N;
    pts.push({ x: center.x + Math.cos(t) * radius, y: center.y + Math.sin(t) * radius });
  }
  return pts;
}

/**
 * Symbol-Linien einer Öffnung.
 * @param o Öffnung; @param a,b Wandpunkte; @param inward nach innen zeigende Normale.
 */
export function openingSymbol(o: Opening, a: Point, b: Point, inward: Point): SymbolLine[] {
  const { u } = wallFrame(a, b);
  const P = (s: number, d: number): Point => ({
    x: a.x + u.x * s + inward.x * d,
    y: a.y + u.y * s + inward.y * d,
  });
  const s0 = o.offsetCm;
  const s1 = o.offsetCm + o.widthCm;
  const w = o.widthCm;
  const out: SymbolLine[] = [];
  const jamb = (s: number): SymbolLine => ({ pts: [P(s, -6), P(s, 6)], style: 'thin' });

  if (o.kind === 'fenster') {
    // Verglasung: Doppellinie in der Wandebene
    out.push({ pts: [P(s0, -2.5), P(s1, -2.5)], style: 'solid' });
    out.push({ pts: [P(s0, 2.5), P(s1, 2.5)], style: 'solid' });
    out.push(jamb(s0), jamb(s1));
    const wt = o.windowType ?? 'dreh-kipp';
    const wings = o.wings ?? 1;
    // Flügelteilung
    for (let i = 1; i < wings; i++) out.push({ pts: [P(s0 + (w * i) / wings, -4), P(s0 + (w * i) / wings, 4)], style: 'thin' });
    if (wt === 'dreh-kipp') {
      // DIN-Dreieck (gestrichelt) je Flügel: Spitze am Anschlag
      const wingW = w / wings;
      for (let i = 0; i < wings; i++) {
        const ws = s0 + wingW * i;
        const hingeLeft = (o.hinge ?? 'links') === 'links' ? i % 2 === 0 : i % 2 === 1;
        const apex = hingeLeft ? ws : ws + wingW;
        const far = hingeLeft ? ws + wingW : ws;
        out.push({ pts: [P(far, -2.5), P(apex, 10), P(far, 2.5)], style: 'dashed' });
      }
    } else if (wt === 'schiebe') {
      // zwei versetzte Halblinien mit Überlappung
      out.push({ pts: [P(s0, -5), P(s0 + w * 0.58, -5)], style: 'solid' });
      out.push({ pts: [P(s0 + w * 0.42, 5), P(s1, 5)], style: 'solid' });
    } else if (wt === 'bodentief') {
      out.push({ pts: [P(s0, 5), P(s1, 5)], style: 'thin' });
    }
    return out;
  }

  if (o.kind === 'durchbruch') {
    // offene Öffnung: Laibungen + gestrichelte Verbindungslinien
    out.push(jamb(s0), jamb(s1));
    out.push({ pts: [P(s0, -5), P(s1, -5)], style: 'dashed' });
    out.push({ pts: [P(s0, 5), P(s1, 5)], style: 'dashed' });
    return out;
  }

  // ── Türen ──
  const dt = o.doorType ?? 'dreh';
  const inwardSign = (o.opensInward ?? true) ? 1 : -1;
  const hingeAtStart = (o.hinge ?? 'links') === 'links';
  out.push(jamb(s0), jamb(s1));

  if (dt === 'durchgang') {
    out.push({ pts: [P(s0, -5), P(s1, -5)], style: 'dashed' });
    out.push({ pts: [P(s0, 5), P(s1, 5)], style: 'dashed' });
    return out;
  }
  if (dt === 'schiebe') {
    // Türblatt läuft VOR der Wand (außenseitig der Öffnungsrichtung), Laufrichtung ab Anschlag
    const d = 9 * inwardSign;
    const runStart = hingeAtStart ? s0 - w * 0.7 : s1 - w * 0.3;
    out.push({ pts: [P(runStart, d), P(runStart + w, d)], style: 'solid' });
    out.push({ pts: [P(hingeAtStart ? s0 : s1, d), P(hingeAtStart ? s0 : s1, d * 0.4)], style: 'thin' });
    return out;
  }
  if (dt === 'pocket') {
    // Blatt halb in der Wandtasche (gestrichelt IN der Wand), halb in der Öffnung
    const pocketFrom = hingeAtStart ? s0 - w : s1;
    out.push({ pts: [P(pocketFrom, 0), P(pocketFrom + w, 0)], style: 'dashed' });
    const leafFrom = hingeAtStart ? s0 : s0 + w * 0.5;
    out.push({ pts: [P(leafFrom, 0), P(leafFrom + w * 0.5, 0)], style: 'solid' });
    return out;
  }
  if (dt === 'falt') {
    // Zickzack (4 Paneele)
    const seg = w / 4;
    const zig: Point[] = [P(s0, 0)];
    for (let i = 0; i < 4; i++) zig.push(P(s0 + seg * (i + 1), i % 2 === 0 ? 10 * inwardSign : 0));
    out.push({ pts: zig, style: 'solid' });
    return out;
  }
  if (dt === 'doppel') {
    const half = w / 2;
    // linker Flügel: Blatt am Anschlag s0 + Viertelbogen zur Mitte
    out.push({ pts: [P(s0, 0), P(s0, half * inwardSign)], style: 'solid' });
    out.push({ pts: arc(P(s0, 0), half, angleOf(u, inward, inwardSign, true), angleOf(u, inward, inwardSign, false)), style: 'thin' });
    // rechter Flügel: Blatt am Anschlag s1 + Viertelbogen zur Mitte
    out.push({ pts: [P(s1, 0), P(s1, half * inwardSign)], style: 'solid' });
    out.push({ pts: arc(P(s1, 0), half, angleOfRev(u, inward, inwardSign, true), angleOfRev(u, inward, inwardSign, false)), style: 'thin' });
    return out;
  }
  // Drehtür (Standard): Blatt senkrecht am Anschlag + Viertelbogen zur Gegenlaibung
  const hs = hingeAtStart ? s0 : s1;
  const leafEnd = P(hs, w * inwardSign);
  out.push({ pts: [P(hs, 0), leafEnd], style: 'solid' });
  const a0 = Math.atan2(inward.y * inwardSign, inward.x * inwardSign);
  const a1 = Math.atan2(hingeAtStart ? u.y : -u.y, hingeAtStart ? u.x : -u.x);
  out.push({ pts: arc(P(hs, 0), w, a0, a1), style: 'thin' });
  return out;
}

/** Bogenwinkel für den linken Doppelflügel. */
function angleOf(u: Point, inward: Point, inwardSign: number, start: boolean): number {
  return start ? Math.atan2(inward.y * inwardSign, inward.x * inwardSign) : Math.atan2(u.y, u.x);
}
/** Bogenwinkel für den rechten Doppelflügel. */
function angleOfRev(u: Point, inward: Point, inwardSign: number, start: boolean): number {
  return start ? Math.atan2(inward.y * inwardSign, inward.x * inwardSign) : Math.atan2(-u.y, -u.x);
}
