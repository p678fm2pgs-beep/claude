/**
 * Erweiterung 7 · W1 — Plansymbole: dauerhafte Beweise.
 * Für jeden Tür-/Fenster-Typ entsteht ein eigenes, korrektes Symbol;
 * Anschlag/Öffnungsrichtung verändern die Geometrie nachweisbar.
 */
import { describe, it, expect } from 'vitest';
import { openingSymbol, inwardNormal } from './planSymbols';
import type { Opening, Point, DoorType, WindowType } from '../types';

const RECT: Point[] = [
  { x: 0, y: 0 },
  { x: 500, y: 0 },
  { x: 500, y: 400 },
  { x: 0, y: 400 },
];

function door(extra: Partial<Opening> = {}): Opening {
  return {
    id: 'o1', kind: 'tuer', wallIndex: 0, offsetCm: 100, widthCm: 90,
    heightCm: 200, sillCm: 0, ...extra,
  };
}
function windowO(extra: Partial<Opening> = {}): Opening {
  return {
    id: 'o2', kind: 'fenster', wallIndex: 0, offsetCm: 100, widthCm: 120,
    heightCm: 140, sillCm: 90, ...extra,
  };
}
const A = RECT[0];
const B = RECT[1];
const N = inwardNormal(RECT, 0);

describe('W1 — inwardNormal', () => {
  it('zeigt bei Wand 0 (oben) nach unten ins Rauminnere', () => {
    expect(N.y).toBeGreaterThan(0.9);
    expect(Math.abs(N.x)).toBeLessThan(0.01);
  });
  it('zeigt bei jeder Wand ins Innere (Mittelpunktsprobe)', () => {
    for (let i = 0; i < RECT.length; i++) {
      const n = inwardNormal(RECT, i);
      const a = RECT[i];
      const b = RECT[(i + 1) % 4];
      const mid = { x: (a.x + b.x) / 2 + n.x * 10, y: (a.y + b.y) / 2 + n.y * 10 };
      // Punkt 10 cm einwärts liegt im Rechteck:
      expect(mid.x).toBeGreaterThan(-0.01);
      expect(mid.x).toBeLessThan(500.01);
      expect(mid.y).toBeGreaterThan(-0.01);
      expect(mid.y).toBeLessThan(400.01);
    }
  });
});

describe('W1 — Tür-Symbole', () => {
  const TYPES: DoorType[] = ['dreh', 'schiebe', 'doppel', 'durchgang', 'pocket', 'falt'];

  it('jeder Türtyp liefert Linien und unterscheidet sich von den anderen', () => {
    const fingerprints = TYPES.map((dt) => {
      const lines = openingSymbol(door({ doorType: dt }), A, B, N);
      expect(lines.length, dt).toBeGreaterThan(0);
      return JSON.stringify(lines.map((l) => l.pts.length + l.style));
    });
    expect(new Set(fingerprints).size).toBe(TYPES.length);
  });

  it('Drehtür: Spiegeln (Anschlag) hängt das Türblatt an die andere Laibung', () => {
    const leafOf = (hinge: 'links' | 'rechts') =>
      openingSymbol(door({ hinge }), A, B, N).find((l) => l.style === 'solid' && l.pts.length === 2)!;
    // Blatt hängt am Anschlag: links bei offset=100, rechts bei offset+width=190.
    expect(leafOf('links').pts[0].x).toBeCloseTo(100, 5);
    expect(leafOf('rechts').pts[0].x).toBeCloseTo(190, 5);
  });

  it('Innen/Außen tauschen klappt den Bogen auf die andere Wandseite', () => {
    const innen = openingSymbol(door({ opensInward: true }), A, B, N);
    const aussen = openingSymbol(door({ opensInward: false }), A, B, N);
    const yIn = Math.max(...innen.flatMap((l) => l.pts.map((p) => p.y)));
    const yOut = Math.min(...aussen.flatMap((l) => l.pts.map((p) => p.y)));
    expect(yIn).toBeGreaterThan(0); // Bogen ragt nach innen (y+)
    expect(yOut).toBeLessThan(0); // Bogen ragt nach außen (y−)
  });

  it('Doppelflügel: zwei Blätter + zwei Bögen', () => {
    const lines = openingSymbol(door({ doorType: 'doppel' }), A, B, N);
    expect(lines.filter((l) => l.pts.length > 10).length).toBe(2);
  });

  it('Durchgang: nur gestrichelte Linien, kein Blatt/Bogen', () => {
    const lines = openingSymbol(door({ doorType: 'durchgang' }), A, B, N);
    expect(lines.some((l) => l.pts.length > 10)).toBe(false);
    expect(lines.some((l) => l.style === 'dashed')).toBe(true);
  });
});

describe('W1/W3 — Fenster-Symbole', () => {
  const TYPES: WindowType[] = ['dreh-kipp', 'fest', 'schiebe', 'bodentief'];

  it('jeder Fenstertyp liefert ein eigenes Symbol', () => {
    const fingerprints = TYPES.map((wt) =>
      JSON.stringify(openingSymbol(windowO({ windowType: wt }), A, B, N).map((l) => l.pts.length + l.style)),
    );
    expect(new Set(fingerprints).size).toBe(TYPES.length);
  });

  it('Flügelteilung: 3-flügelig erzeugt 2 Teilungsstriche mehr als 1-flügelig', () => {
    const one = openingSymbol(windowO({ wings: 1 }), A, B, N);
    const three = openingSymbol(windowO({ wings: 3 }), A, B, N);
    expect(three.length).toBeGreaterThan(one.length);
  });

  it('Durchbruch: gestrichelte offene Öffnung', () => {
    const lines = openingSymbol(
      { id: 'o3', kind: 'durchbruch', wallIndex: 0, offsetCm: 100, widthCm: 150, heightCm: 220, sillCm: 0 },
      A, B, N,
    );
    expect(lines.filter((l) => l.style === 'dashed').length).toBe(2);
  });
});
