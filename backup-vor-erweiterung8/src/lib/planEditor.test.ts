/**
 * Erweiterung 7 · W2 — Drag-Logik: dauerhafte Beweise.
 * Objekt gleitet NUR entlang der Wand, kollidiert nicht, rastet ein,
 * wechselt kontrolliert die Wand, Eck-Eingabe exakt.
 */
import { describe, it, expect } from 'vitest';
import {
  projectOntoWall,
  pointOnWall,
  clampOpeningOffset,
  snapOffset,
  dragOpeningTo,
  wallSwitchCandidate,
  cornerDistances,
  offsetFromCorner,
} from './planEditor';
import type { Floorplan, Opening } from '../types';

function plan(openings: Opening[] = []): Floorplan {
  return {
    points: [
      { x: 0, y: 0 },
      { x: 500, y: 0 },
      { x: 500, y: 400 },
      { x: 0, y: 400 },
    ],
    openings,
  };
}
const door = (id: string, offsetCm: number, widthCm = 90, wallIndex = 0): Opening => ({
  id, kind: 'tuer', wallIndex, offsetCm, widthCm, heightCm: 200, sillCm: 0,
});

describe('W2 — Projektion auf die Wandachse', () => {
  it('projiziert senkrecht: Maus über der Wand → Fußpunkt', () => {
    const { s, distCm } = projectOntoWall(plan().points, 0, { x: 200, y: 35 });
    expect(s).toBe(200);
    expect(distCm).toBe(35);
  });
  it('kann die Wand nie verlassen: pointOnWall bleibt auf der Achse', () => {
    const p = pointOnWall(plan().points, 0, 123);
    expect(p).toEqual({ x: 123, y: 0 });
  });
});

describe('W2 — Kollisionsschutz', () => {
  it('hält die Öffnung innerhalb der Wandenden', () => {
    expect(clampOpeningOffset(plan(), 0, 90, -50)).toBe(0);
    expect(clampOpeningOffset(plan(), 0, 90, 999)).toBe(410);
  });
  it('sanfter Stopp am Nachbarn (keine Überlappung)', () => {
    const p = plan([door('a', 200)]);
    // von links kommend: stoppt bei 200-90=110
    expect(clampOpeningOffset(p, 0, 90, 180, 'b')).toBe(110);
    // von rechts kommend: stoppt bei 290
    expect(clampOpeningOffset(p, 0, 90, 240, 'b')).toBe(290);
  });
  it('die gezogene Öffnung selbst wird ignoriert', () => {
    const p = plan([door('a', 200)]);
    expect(clampOpeningOffset(p, 0, 90, 205, 'a')).toBe(205);
  });
});

describe('W2 — Einrasten', () => {
  it('rastet an der Wandmitte ein (Fangweite 6 cm)', () => {
    expect(snapOffset(202, 90, 500)).toBe(205); // Mitte = (500-90)/2
    expect(snapOffset(190, 90, 500)).toBe(190); // außerhalb der Fangweite → Raster
  });
  it('10-cm-Raster normal, 1 cm fein', () => {
    expect(snapOffset(163, 90, 500)).toBe(160);
    expect(snapOffset(163.4, 90, 500, true)).toBe(163);
  });
});

describe('W2 — kompletter Drag-Schritt', () => {
  it('Maus mittig über der Wand → Öffnung zentriert am Cursor, gerastert, geklemmt', () => {
    const p = plan([door('a', 30)]);
    const off = dragOpeningTo(p, 'a', 0, { x: 250, y: 20 });
    expect(off).toBe(205); // 250 - 45 = 205 = Wandmitte
  });
  it('Ziehen über das Wandende hinaus → bleibt am Ende stehen', () => {
    const p = plan([door('a', 30)]);
    expect(dragOpeningTo(p, 'a', 0, { x: 990, y: 10 })).toBe(410);
  });
});

describe('W2 — Wand-Wechsel', () => {
  it('nahe an anderer Wand → Kandidat; weit weg → null', () => {
    const pts = plan().points;
    // Zeiger nahe der rechten Wand (Wand 1)
    expect(wallSwitchCandidate(pts, { x: 490, y: 200 }, 0)).toBe(1);
    // Zeiger mitten im Raum → kein Wechsel
    expect(wallSwitchCandidate(pts, { x: 250, y: 200 }, 0)).toBeNull();
    // Zeiger nahe der aktuellen Wand → kein Wechsel
    expect(wallSwitchCandidate(pts, { x: 250, y: 10 }, 0)).toBeNull();
  });
});

describe('W2 — Eck-Maße + exakte Eingabe', () => {
  it('cornerDistances links/rechts korrekt', () => {
    const p = plan([door('a', 120)]);
    expect(cornerDistances(p, p.openings[0])).toEqual({ leftCm: 120, rightCm: 290 });
  });
  it('offsetFromCorner: „50 cm zur rechten Ecke" → exakte Position', () => {
    const p = plan([door('a', 120)]);
    expect(offsetFromCorner(p, p.openings[0], 'rechts', 50)).toBe(360);
    expect(offsetFromCorner(p, p.openings[0], 'links', 50)).toBe(50);
  });
  it('exakte Eingabe respektiert Kollisionen', () => {
    const p = plan([door('a', 120), door('b', 300)]);
    // b sitzt bei 300..390 — a auf links 250 gewünscht (250..340 überlappt) → stoppt bei 210
    expect(offsetFromCorner(p, p.openings[0], 'links', 250)).toBe(210);
  });
});
