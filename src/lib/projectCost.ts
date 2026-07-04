/**
 * HAVEN ATELIER — Integrations-Schicht der Kosten-Engine.
 * Verbindet Projekt-Datenmodell + Kataloge zu vollständigen Kostenaufstellungen.
 * Reine Funktionen — unit-getestet. Rundung erst am Ende.
 */
import type { Project, Room, PriceTier } from '../types';
import {
  type CostLine,
  type ProjectCost,
  type RoomCost,
  type Gewerk,
  type CostRange,
  VERSCHNITT,
  paintCost,
  furnitureCost,
  feeAmount,
  reserveAmount,
  vatAmount,
  sumLines,
  sumEk,
  addRange,
  roundRange,
} from './costs';
import { deriveAreas, netWallAreaForWallM2, skirtingLengthM, round2 } from './geometry';
import { findMaterial, type Material } from '../data/materials';
import { findAddon, type Addon } from '../data/addons';
import { findFurnitureType } from '../data/furniture';
import { placedQuantity, footprintAreaM2 } from './objects';
import { findTrade } from '../data/prices';
import { findFixture } from '../data/lighting';
import {
  PAINT_PRICES,
  PAINT_COATS,
  PAINT_COVERAGE_DEFAULT,
  GEBINDE_SIZES,
} from '../data/prices';

const PAINT_MATERIAL_IDS = new Set(['wandfarbe-matt', 'decke-anstrich']);

function isPaint(material: Material): boolean {
  return PAINT_MATERIAL_IDS.has(material.id);
}

function verschnittFor(pattern: string | undefined, material: Material): number {
  if (material.subcategory.toLowerCase().includes('fliesen') || material.surface !== 'boden') {
    if (material.tech.format?.includes('120')) return VERSCHNITT.grossformat;
  }
  if (!pattern) return VERSCHNITT.gerade;
  return VERSCHNITT[pattern] ?? VERSCHNITT.gerade;
}

interface Areas {
  floor: number;
  ceiling: number;
  wall: number;
  perimeter: number;
  skirting: number;
}

function addonQty(addon: Addon, areas: Areas): number {
  switch (addon.basis) {
    case 'bodenflaeche':
      return areas.floor;
    case 'wandflaeche':
      return areas.wall;
    case 'deckenflaeche':
      return areas.ceiling;
    case 'sockel':
      return areas.skirting;
    case 'pauschal':
      return 1;
  }
}

let lineSeq = 0;
function lineId(): string {
  lineSeq += 1;
  return `cl_${lineSeq}`;
}

/** Baut alle Kostenzeilen eines Raumes (aktive Variante). */
/** (Erweiterung 8 · T3) Anzeigenamen der Elektro-Symbole für die Mengenliste. */
export const ELECTRO_LABELS: Record<string, string> = {
  steckdose1: 'Steckdose 1er',
  steckdose2: 'Steckdose 2er',
  steckdose3: 'Steckdose 3er',
  schalter: 'Schalter einfach',
  wechsel: 'Wechselschalter',
  doppel: 'Doppelschalter',
  deckenauslass: 'Deckenauslass',
  wandauslass: 'Wandauslass',
  netzwerk: 'Netzwerk-Dose',
  tv: 'TV-Dose',
  herd: 'Herdanschluss',
};

export function computeRoomCost(room: Room, coverage: number): RoomCost {
  lineSeq = 0;
  const variant = room.variants.find((v) => v.id === room.activeVariantId) ?? room.variants[0];
  const d = deriveAreas(room.floorplan, room.heightCm);
  const areas: Areas = {
    floor: d.floorAreaM2,
    ceiling: d.ceilingAreaM2,
    wall: d.netWallAreaM2,
    perimeter: d.perimeterM,
    skirting: skirtingLengthM(room.floorplan),
  };
  const lines: CostLine[] = [];

  for (const sel of variant?.materials ?? []) {
    const m = findMaterial(sel.materialId);
    if (!m) continue;
    const price = m.prices[sel.tier];

    if (m.surface === 'boden') {
      const versch = verschnittFor(sel.pattern, m);
      const qty = round2(areas.floor * (1 + versch));
      const unitVK = price.materialVK + price.laborVK;
      const unitEK = price.materialEK + price.laborEK;
      lines.push(mkLine(m.name, 'boden', qty, m.prices[sel.tier].unit, unitVK, unitVK, qty * unitEK, qty * unitEK, sel.tier, {
        verschnitt: `${Math.round(versch * 100)}%`,
      }));
    } else if (m.surface === 'wand') {
      const area = sel.wallIndex !== undefined ? netWallAreaForWallM2(room.floorplan, sel.wallIndex, room.heightCm) : areas.wall;
      if (isPaint(m)) {
        lines.push(paintLine(m.name, 'wand', area, sel.tier, coverage));
      } else {
        const unitVK = price.materialVK + price.laborVK;
        const unitEK = price.materialEK + price.laborEK;
        lines.push(mkLine(m.name, 'wand', round2(area), 'm²', unitVK, unitVK, area * unitEK, area * unitEK, sel.tier));
      }
    } else if (m.surface === 'decke') {
      if (isPaint(m)) {
        lines.push(paintLine(m.name, 'decke', areas.ceiling, sel.tier, coverage));
      } else {
        const unitVK = price.materialVK + price.laborVK;
        const unitEK = price.materialEK + price.laborEK;
        lines.push(mkLine(m.name, 'decke', round2(areas.ceiling), 'm²', unitVK, unitVK, areas.ceiling * unitEK, areas.ceiling * unitEK, sel.tier));
      }
    }
    // surface 'sonstiges' (Textil/Metall) erzeugt keine Flächenkosten.

    // Nebenpositionen
    const disabled = new Set(sel.addonsDisabled ?? []);
    for (const addonId of m.addons) {
      if (disabled.has(addonId)) continue;
      const addon = findAddon(addonId);
      if (!addon) continue;
      const qty = round2(addonQty(addon, areas));
      if (qty <= 0) continue;
      lines.push(
        mkLine(addon.name, addon.gewerk, qty, addon.unit, addon.vk, addon.vk, qty * addon.ek, qty * addon.ek, sel.tier, {
          nebenposition: 1,
        }),
      );
    }
  }

  // Möbel & Leuchten
  for (const item of variant?.furniture ?? []) {
    const ft = findFurnitureType(item.typeId);
    const range = ft ? furnitureCost(item.quantity, ft.price[item.tier][0], ft.price[item.tier][1]) : { min: 0, max: 0 };
    const ekMin = range.min * 0.6;
    const ekMax = range.max * 0.6;
    const gewerk: Gewerk = item.typeId.includes('leuchte') || item.typeId.includes('pendel') ? 'leuchten' : 'moebel';
    lines.push({
      id: lineId(),
      label: item.label,
      gewerk,
      qty: item.quantity,
      unit: item.unit,
      unitMin: ft ? ft.price[item.tier][0] : 0,
      unitMax: ft ? ft.price[item.tier][1] : 0,
      totalMin: range.min,
      totalMax: range.max,
      ekMin,
      ekMax,
      tier: item.tier,
    });
  }

  // (Erweiterung 8 · T2) Platzierte Einrichtung — eigene Positionen mit Maß im Namen.
  // lfm-Typen zählen die Breite in Metern; Bestandsmöbel des Kunden zählen NIE.
  for (const po of variant?.placed ?? []) {
    if (po.bestand) continue;
    const ft = findFurnitureType(po.typeId);
    if (!ft) continue;
    const qty = placedQuantity(po, ft.unit);
    const [von, bis] = ft.price[po.tier];
    const gewerk: Gewerk =
      ft.place?.category === 'heizkoerper' ? 'heizung' : ft.place?.category === 'leuchte' ? 'leuchten' : 'moebel';
    lines.push({
      id: lineId(),
      label: `${po.label ?? ft.name} (${Math.round(po.widthCm)}×${Math.round(po.depthCm)} cm)`,
      gewerk,
      qty,
      unit: ft.unit,
      unitMin: von,
      unitMax: bis,
      totalMin: round2(von * qty),
      totalMax: round2(bis * qty),
      ekMin: round2(von * qty * 0.6),
      ekMax: round2(bis * qty * 0.6),
      tier: po.tier,
    });
  }

  // (Erweiterung 8 · T4) FBH-Zonen: gezeichnete Zonen-m² über die bestehende FBH-Position.
  const zonesM2 = (variant?.heatZones ?? []).reduce((s, z) => s + footprintAreaM2(z.poly), 0);
  if (zonesM2 > 0) {
    const fbh = findTrade('fbh');
    if (fbh) {
      const [von, bis, ekVon, ekBis] = fbh.prices.premium;
      const qty = round2(zonesM2);
      lines.push({
        id: lineId(),
        label: `${fbh.name} (Zonen)`,
        gewerk: fbh.gewerk,
        qty,
        unit: 'm²',
        unitMin: von,
        unitMax: bis,
        totalMin: round2(von * qty),
        totalMax: round2(bis * qty),
        ekMin: round2(ekVon * qty),
        ekMax: round2(ekBis * qty),
        tier: 'premium',
      });
    }
  }

  // (Erweiterung 8 · T3) Elektro-Zähler: Stückzahlen je Art (Preise nur, wenn im
  // Preis-Manager Positionen existieren — sonst ehrliche 0-Preise, reine Mengenliste).
  const electroCounts = new Map<string, number>();
  for (const e of variant?.electro ?? []) {
    electroCounts.set(e.kind, (electroCounts.get(e.kind) ?? 0) + 1);
  }
  for (const [kind, count] of electroCounts) {
    lines.push({
      id: lineId(),
      label: `Elektro: ${ELECTRO_LABELS[kind] ?? kind}`,
      gewerk: 'elektro',
      qty: count,
      unit: 'Stk',
      unitMin: 0,
      unitMax: 0,
      totalMin: 0,
      totalMax: 0,
      ekMin: 0,
      ekMax: 0,
    });
  }

  // Gewerke-Positionen (Bad/Küche/Heizung/Smart-Home)
  for (const ts of variant?.trades ?? []) {
    const trade = findTrade(ts.tradeId);
    if (!trade) continue;
    const [von, bis, ekVon, ekBis] = trade.prices[ts.tier];
    let qty = ts.quantity;
    if (trade.unit === 'm²') qty = areas.floor; // FBH etc. flächenbezogen
    lines.push({
      id: lineId(),
      label: trade.name,
      gewerk: trade.gewerk,
      qty: round2(qty),
      unit: trade.unit,
      unitMin: von,
      unitMax: bis,
      totalMin: von * qty,
      totalMax: bis * qty,
      ekMin: ekVon * qty,
      ekMax: ekBis * qty,
      tier: ts.tier,
    });
  }

  // Beleuchtung (Erweiterung 4) — additiv. Voute/Profile lfm-basiert, sonst Stückzahl.
  for (const ls of variant?.lights ?? []) {
    const fx = findFixture(ls.fixtureId);
    if (!fx) continue;
    const [von, bis] = fx.price[ls.tier];
    // Für laufende Meter ohne Eingabe: Raumumfang als sinnvoller Default (z. B. umlaufende Voute).
    const qty = ls.quantity > 0 ? ls.quantity : fx.unit === 'lfm' ? round2(areas.perimeter) : 1;
    lines.push({
      id: lineId(),
      label: fx.name,
      gewerk: 'leuchten',
      qty: round2(qty),
      unit: fx.unit,
      unitMin: von,
      unitMax: bis,
      totalMin: von * qty,
      totalMax: bis * qty,
      ekMin: von * qty * fx.ekFactor,
      ekMax: bis * qty * fx.ekFactor,
      tier: ls.tier,
    });
  }

  const subtotal = sumLines(lines);
  const ekSubtotal = sumEk(lines);
  return { roomId: room.id, roomName: room.name, lines, subtotal, ekSubtotal };
}

function mkLine(
  label: string,
  gewerk: Gewerk,
  qty: number,
  unit: string,
  unitMin: number,
  unitMax: number,
  ekMin: number,
  ekMax: number,
  tier: PriceTier,
  meta?: Record<string, string | number>,
): CostLine {
  return {
    id: lineId(),
    label,
    gewerk,
    qty,
    unit,
    unitMin,
    unitMax,
    totalMin: qty * unitMin,
    totalMax: qty * unitMax,
    ekMin,
    ekMax,
    tier,
    meta,
  };
}

function paintLine(label: string, gewerk: Gewerk, area: number, tier: PriceTier, coverage: number): CostLine {
  const p = PAINT_PRICES[tier];
  const vk = paintCost(area, PAINT_COATS, coverage || PAINT_COVERAGE_DEFAULT, p.literVK, p.laborVKperM2, GEBINDE_SIZES);
  const ek = paintCost(area, PAINT_COATS, coverage || PAINT_COVERAGE_DEFAULT, p.literEK, p.laborEKperM2, GEBINDE_SIZES);
  const unit = area > 0 ? vk.total / area : 0;
  return {
    id: lineId(),
    label,
    gewerk: gewerk === 'wand' ? 'maler' : 'maler',
    qty: round2(area),
    unit: 'm²',
    unitMin: round2(unit),
    unitMax: round2(unit),
    totalMin: vk.total,
    totalMax: vk.total,
    ekMin: ek.total,
    ekMax: ek.total,
    tier,
    meta: { anstriche: PAINT_COATS, liter: round2(vk.liters) },
  };
}

/** Vollständige Projekt-Kostenaufstellung inkl. Honorar, Reserve, MwSt. */
export function computeProjectCost(project: Project): ProjectCost {
  const rooms = project.rooms.map((r) => computeRoomCost(r, project.settings.paintCoverage));
  const baseSubtotal = rooms.reduce<CostRange>((acc, r) => addRange(acc, r.subtotal), { min: 0, max: 0 });
  const ekRooms = rooms.reduce<CostRange>((acc, r) => addRange(acc, r.ekSubtotal), { min: 0, max: 0 });

  const feeRange = feeAmount(baseSubtotal, project.settings.fee);
  const fee: CostLine = {
    id: 'fee',
    label: project.settings.fee.type === 'prozent' ? `HAVEN-Honorar (${project.settings.fee.value}%)` : 'HAVEN-Honorar (Pauschale)',
    gewerk: 'honorar',
    qty: 1,
    unit: 'psch',
    unitMin: feeRange.min,
    unitMax: feeRange.max,
    totalMin: feeRange.min,
    totalMax: feeRange.max,
  };

  const baseWithFee = addRange(baseSubtotal, feeRange);
  const reserveRange = reserveAmount(baseWithFee, project.settings.reservePercent);
  const reserve: CostLine = {
    id: 'reserve',
    label: `Unvorhergesehenes & Reserve (${project.settings.reservePercent}%)`,
    gewerk: 'reserve',
    qty: 1,
    unit: 'psch',
    unitMin: reserveRange.min,
    unitMax: reserveRange.max,
    totalMin: reserveRange.min,
    totalMax: reserveRange.max,
  };

  const net = addRange(baseWithFee, reserveRange);
  const vat = vatAmount(net, project.settings.vatPercent);
  const gross = addRange(net, vat);

  // Gewerke-Aggregation für Donut (inkl. Honorar & Reserve).
  const byGewerkMap = new Map<Gewerk, { min: number; max: number }>();
  const addGewerk = (g: Gewerk, min: number, max: number) => {
    const cur = byGewerkMap.get(g) ?? { min: 0, max: 0 };
    cur.min += min;
    cur.max += max;
    byGewerkMap.set(g, cur);
  };
  for (const r of rooms) for (const l of r.lines) addGewerk(l.gewerk, l.totalMin, l.totalMax);
  addGewerk('honorar', fee.totalMin, fee.totalMax);
  addGewerk('reserve', reserve.totalMin, reserve.totalMax);

  return {
    rooms,
    baseSubtotal: roundRange(baseSubtotal),
    fee: { ...fee, ...roundLineTotals(fee) },
    reserve: { ...reserve, ...roundLineTotals(reserve) },
    net: roundRange(net),
    vat: roundRange(vat),
    gross: roundRange(gross),
    ekTotal: roundRange(ekRooms),
    byGewerk: [...byGewerkMap.entries()].map(([gewerk, v]) => ({ gewerk, min: Math.round(v.min), max: Math.round(v.max) })),
  };
}

function roundLineTotals(l: CostLine): Pick<CostLine, 'totalMin' | 'totalMax'> {
  return { totalMin: Math.round(l.totalMin), totalMax: Math.round(l.totalMax) };
}
