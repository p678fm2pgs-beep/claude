import { describe, it, expect } from 'vitest';
import { computeRoomCost, computeProjectCost } from './projectCost';
import { createProject, createRoom, createDemoProject } from './factory';
import { skirtingLengthM, deriveAreas } from './geometry';
import { uid } from './id';

function projectWithRoom() {
  const p = createProject('Test');
  const room = createRoom('Wohnen', 'wohnzimmer', 520, 440, 270);
  // 1 Tür für Sockelleisten-Logik
  room.floorplan.openings = [{ id: uid('op'), kind: 'tuer', wallIndex: 0, offsetCm: 50, widthCm: 100, heightCm: 210, sillCm: 0 }];
  const v = room.variants[0];
  v.materials = [
    { id: uid('ms'), materialId: 'parkett-eiche-landhaus', surface: 'boden', tier: 'standard', pattern: 'gerade' },
    { id: uid('ms'), materialId: 'wandfarbe-matt', surface: 'wand', tier: 'standard' },
  ];
  p.rooms = [room];
  return { p, room };
}

describe('Projekt-Kosten — Integration', () => {
  it('Boden erzeugt Verschnitt-Menge und Nebenpositionen', () => {
    const { p, room } = projectWithRoom();
    const rc = computeRoomCost(room, p.settings.paintCoverage);
    const floorLine = rc.lines.find((l) => l.gewerk === 'boden' && l.label.includes('Eiche'));
    expect(floorLine).toBeDefined();
    // Menge = Fläche × 1,05
    const area = deriveAreas(room.floorplan, room.heightCm).floorAreaM2;
    expect(floorLine!.qty).toBeCloseTo(Math.round(area * 1.05 * 100) / 100, 1);
  });

  it('Sockelleisten-Menge = Umfang − Türbreite', () => {
    const { p, room } = projectWithRoom();
    const rc = computeRoomCost(room, p.settings.paintCoverage);
    const skirting = rc.lines.find((l) => l.label.toLowerCase().includes('sockel'));
    expect(skirting).toBeDefined();
    expect(skirting!.qty).toBeCloseTo(skirtingLengthM(room.floorplan), 1);
  });

  it('Wandfarbe erzeugt Maler-Position mit 2 Anstrichen', () => {
    const { p, room } = projectWithRoom();
    const rc = computeRoomCost(room, p.settings.paintCoverage);
    const paint = rc.lines.find((l) => l.gewerk === 'maler' && l.meta?.anstriche === 2);
    expect(paint).toBeDefined();
    expect(paint!.totalMin).toBeGreaterThan(0);
  });

  it('Projektsumme: Brutto > Netto, Reserve sichtbar, Honorar vorhanden', () => {
    const { p } = projectWithRoom();
    const cost = computeProjectCost(p);
    expect(cost.gross.min).toBeGreaterThan(cost.net.min);
    expect(cost.reserve.totalMin).toBeGreaterThan(0);
    expect(cost.fee.totalMin).toBeGreaterThan(0);
    expect(cost.net.min).toBeGreaterThan(0);
  });

  it('Reserve 0% → Reserve-Position 0, Brutto immer noch > Netto durch MwSt', () => {
    const { p } = projectWithRoom();
    p.settings.reservePercent = 0;
    const cost = computeProjectCost(p);
    expect(cost.reserve.totalMin).toBe(0);
    expect(cost.gross.min).toBeGreaterThan(cost.net.min);
  });

  it('höhere Preisstufe ergibt höhere Summe', () => {
    const { p, room } = projectWithRoom();
    const std = computeRoomCost(room, p.settings.paintCoverage).subtotal.min;
    room.variants[0].materials.forEach((m) => (m.tier = 'luxus'));
    const lux = computeRoomCost(room, p.settings.paintCoverage).subtotal.min;
    expect(lux).toBeGreaterThan(std);
  });

  it('Demo-Projekt: 3 Räume, Summe > 0, keine NaN', () => {
    const demo = createDemoProject();
    expect(demo.rooms.length).toBe(3);
    const cost = computeProjectCost(demo);
    expect(cost.gross.min).toBeGreaterThan(0);
    expect(Number.isNaN(cost.net.min)).toBe(false);
    expect(Number.isNaN(cost.gross.max)).toBe(false);
    // Bad enthält Sanitär-Gewerk
    const badCost = cost.rooms.find((r) => r.roomName === 'Bad');
    expect(badCost!.lines.some((l) => l.gewerk === 'sanitaer')).toBe(true);
    // Küche enthält Küchen-Gewerk
    const kuecheCost = cost.rooms.find((r) => r.roomName === 'Küche');
    expect(kuecheCost!.lines.some((l) => l.gewerk === 'kueche')).toBe(true);
  });

  it('byGewerk-Aggregation summiert sich plausibel (inkl. Honorar & Reserve)', () => {
    const demo = createDemoProject();
    const cost = computeProjectCost(demo);
    expect(cost.byGewerk.some((g) => g.gewerk === 'honorar')).toBe(true);
    expect(cost.byGewerk.some((g) => g.gewerk === 'reserve')).toBe(true);
    expect(cost.byGewerk.every((g) => g.min >= 0)).toBe(true);
  });
});
