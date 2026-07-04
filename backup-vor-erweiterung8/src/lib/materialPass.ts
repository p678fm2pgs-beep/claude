/**
 * HAVEN ATELIER — Material-Pass (Erweiterung 6 · S11).
 * Leitet aus den gepflegten technischen Daten eines Materials einen strukturierten
 * Pass ab: Pflege, Haltbarkeit, Eignung, Nachhaltigkeit. Reine Ableitung aus
 * Katalogdaten + kategoriebasierter Einschätzung (als solche gekennzeichnet) —
 * keine erfundenen Messwerte.
 */
import type { Material } from '../data/materials';

export interface PassSection {
  /** 1–5 (5 = am besten) — für die Punkt-Anzeige. */
  score: number;
  /** Kurzfazit. */
  summary: string;
  summaryEn: string;
  /** Detailzeilen. */
  lines: string[];
  linesEn: string[];
}

export interface MaterialPass {
  pflege: PassSection;
  haltbarkeit: PassSection;
  eignung: PassSection;
  nachhaltigkeit: PassSection;
}

/** Materialgruppe grob aus Subkategorie/ID ableiten (für Einschätzungstexte). */
function groupOf(m: Material): string {
  const s = `${m.subcategory} ${m.id}`.toLowerCase();
  if (/parkett|diele|holz|bambus|kork/.test(s)) return 'holz';
  if (/naturstein|marmor|granit|travertin|schiefer|kalkstein|quarzit|sandstein|onyx/.test(s)) return 'stein';
  if (/feinstein|fliese|zellige|metro|zement/.test(s)) return 'keramik';
  if (/vinyl|spc|rigid|laminat/.test(s)) return 'kunststoff';
  if (/linoleum/.test(s)) return 'linoleum';
  if (/teppich|sisal|textil/.test(s)) return 'textil';
  if (/kalk|lehm|tadelakt|putz|spachtel|mikrozement|gussboden/.test(s)) return 'mineralisch';
  if (/tapete|vlies|gras/.test(s)) return 'tapete';
  if (/metall/.test(s)) return 'metall';
  return 'sonstig';
}

function pflegeSection(m: Material): PassSection {
  const level = m.tech.pflege ?? 'mittel';
  const score = level === 'gering' ? 5 : level === 'mittel' ? 3 : 2;
  const map: Record<string, [string, string]> = {
    gering: ['Pflegeleicht im Alltag', 'Easy everyday care'],
    mittel: ['Regelmäßige, unkomplizierte Pflege', 'Regular, straightforward care'],
    hoch: ['Anspruchsvoll — braucht Routine', 'Demanding — needs a routine'],
  };
  const g = groupOf(m);
  const lines: string[] = [];
  const linesEn: string[] = [];
  if (g === 'holz') {
    lines.push('Nebelfeucht wischen, keine stehende Nässe.', 'Geölte Flächen periodisch nachölen.');
    linesEn.push('Damp-mop only, no standing water.', 'Re-oil oiled surfaces periodically.');
  } else if (g === 'stein') {
    lines.push('pH-neutrale Reiniger — Säure (Essig, Zitrus) meiden.', 'Imprägnierung je nach Nutzung auffrischen.');
    linesEn.push('pH-neutral cleaners — avoid acids (vinegar, citrus).', 'Refresh impregnation depending on use.');
  } else if (g === 'keramik') {
    lines.push('Unempfindlich — feucht wischen genügt.', 'Fugen gelegentlich gezielt reinigen.');
    linesEn.push('Robust — damp mopping is enough.', 'Clean grout lines occasionally.');
  } else if (g === 'textil') {
    lines.push('Regelmäßig saugen, Flecken sofort tupfen (nicht reiben).');
    linesEn.push('Vacuum regularly; blot stains immediately (do not rub).');
  } else {
    lines.push('Herstellerhinweise beachten; milde Reiniger bevorzugen.');
    linesEn.push('Follow manufacturer guidance; prefer mild cleaners.');
  }
  return { score, summary: map[level]?.[0] ?? map.mittel[0], summaryEn: map[level]?.[1] ?? map.mittel[1], lines, linesEn };
}

function haltbarkeitSection(m: Material): PassSection {
  const g = groupOf(m);
  let score = 3;
  if (g === 'stein' || g === 'keramik' || g === 'mineralisch') score = 5;
  else if (g === 'holz') score = 4;
  else if (g === 'kunststoff' || g === 'linoleum') score = 3;
  else if (g === 'textil' || g === 'tapete') score = 2;
  const lines: string[] = [];
  const linesEn: string[] = [];
  if (m.tech.nutzungsklasse) {
    lines.push(`Nutzungsklasse ${m.tech.nutzungsklasse}.`);
    linesEn.push(`Usage class ${m.tech.nutzungsklasse}.`);
  }
  if (m.tech.nutzschichtMm) {
    lines.push(`Nutzschicht ${m.tech.nutzschichtMm} mm — mehrfach renovierbar.`);
    linesEn.push(`Wear layer ${m.tech.nutzschichtMm} mm — can be refinished.`);
  }
  if (m.tech.staerkeMm) {
    lines.push(`Aufbaustärke ${m.tech.staerkeMm} mm.`);
    linesEn.push(`Total thickness ${m.tech.staerkeMm} mm.`);
  }
  if (g === 'holz') {
    lines.push('Patina gehört zum Material — Kratzer lassen sich ausschleifen.');
    linesEn.push('Patina is part of the material — scratches can be sanded out.');
  }
  if (g === 'stein' || g === 'keramik') {
    lines.push('Generationenfest bei fachgerechter Verlegung.');
    linesEn.push('Lasts generations when installed properly.');
  }
  if (lines.length === 0) {
    lines.push('Lebensdauer abhängig von Nutzung und Pflege — Herstellerangaben beachten.');
    linesEn.push('Lifespan depends on use and care — follow manufacturer guidance.');
  }
  const summary =
    score >= 5 ? 'Sehr langlebig' : score === 4 ? 'Langlebig mit Pflege' : score === 3 ? 'Solide Gebrauchsdauer' : 'Bewusst wohnlich, begrenzte Lebensdauer';
  const summaryEn =
    score >= 5 ? 'Extremely durable' : score === 4 ? 'Durable with care' : score === 3 ? 'Solid service life' : 'Deliberately soft, limited lifespan';
  return { score, summary, summaryEn, lines, linesEn };
}

function eignungSection(m: Material): PassSection {
  const lines: string[] = [];
  const linesEn: string[] = [];
  const fbh = m.tech.fbh;
  lines.push(fbh === 'ja' ? 'Fußbodenheizung: geeignet.' : fbh === 'nein' ? 'Fußbodenheizung: nicht geeignet.' : 'Fußbodenheizung: bedingt (System prüfen).');
  linesEn.push(fbh === 'ja' ? 'Underfloor heating: suitable.' : fbh === 'nein' ? 'Underfloor heating: not suitable.' : 'Underfloor heating: conditional (check system).');
  lines.push(m.tech.nasszelle ? 'Nasszelle/Bad: geeignet.' : 'Nasszelle/Bad: nicht empfohlen.');
  linesEn.push(m.tech.nasszelle ? 'Wet rooms: suitable.' : 'Wet rooms: not recommended.');
  if (m.tech.rutschklasse) {
    lines.push(`Rutschhemmung ${m.tech.rutschklasse}.`);
    linesEn.push(`Slip resistance ${m.tech.rutschklasse}.`);
  }
  lines.push(m.tech.aussen ? 'Außenbereich: möglich.' : 'Nur Innenbereich.');
  linesEn.push(m.tech.aussen ? 'Outdoor use: possible.' : 'Indoor only.');
  const score = (m.tech.fbh === 'ja' ? 2 : 1) + (m.tech.nasszelle ? 2 : 1) + (m.tech.aussen ? 1 : 0);
  return {
    score: Math.min(5, score),
    summary: 'Einsatzbereiche laut Katalogdaten',
    summaryEn: 'Application areas per catalogue data',
    lines,
    linesEn,
  };
}

function nachhaltigkeitSection(m: Material): PassSection {
  const g = groupOf(m);
  let score = 3;
  const lines: string[] = [];
  const linesEn: string[] = [];
  if (g === 'holz') {
    score = 5;
    lines.push('Nachwachsender Rohstoff; bindet CO₂ über die Nutzungsdauer.', 'Auf FSC/PEFC-Zertifizierung der Charge achten.');
    linesEn.push('Renewable resource; stores CO₂ over its lifetime.', 'Check batch for FSC/PEFC certification.');
  } else if (g === 'linoleum') {
    score = 5;
    lines.push('Aus Leinöl, Kork- und Holzmehl — überwiegend nachwachsend.');
    linesEn.push('Made from linseed oil, cork and wood flour — largely renewable.');
  } else if (g === 'mineralisch') {
    score = 4;
    lines.push('Mineralisch, diffusionsoffen, sehr langlebig.');
    linesEn.push('Mineral, breathable, very long-lived.');
  } else if (g === 'stein') {
    score = 3;
    lines.push('Extrem langlebig — relativiert den Abbau-Fußabdruck.', 'Regionale Herkunft verbessert die Bilanz deutlich.');
    linesEn.push('Extremely long-lived — offsets quarrying footprint.', 'Regional sourcing improves the balance considerably.');
  } else if (g === 'keramik') {
    score = 3;
    lines.push('Energieintensiv im Brand, dafür jahrzehntelange Nutzung.');
    linesEn.push('Energy-intensive firing, but decades of use.');
  } else if (g === 'kunststoff') {
    score = 2;
    lines.push('PVC-/Kunststoffanteil — auf phthalatfreie Qualität achten.');
    linesEn.push('Contains PVC/plastics — choose phthalate-free quality.');
  } else if (g === 'textil') {
    score = 3;
    lines.push('Naturfaser-Qualitäten (Wolle, Sisal) bevorzugen.');
    linesEn.push('Prefer natural-fibre qualities (wool, sisal).');
  } else {
    lines.push('Einschätzung je nach Charge/Hersteller.');
    linesEn.push('Depends on batch/manufacturer.');
  }
  if (m.tech.emission) {
    lines.push(`Emissionsklasse ${m.tech.emission}.`);
    linesEn.push(`Emission class ${m.tech.emission}.`);
  }
  const summary = score >= 5 ? 'Sehr gute Bilanz' : score === 4 ? 'Gute Bilanz' : score === 3 ? 'Ausgewogen' : 'Bewusst abwägen';
  const summaryEn = score >= 5 ? 'Very good balance' : score === 4 ? 'Good balance' : score === 3 ? 'Balanced' : 'Weigh consciously';
  return { score, summary, summaryEn, lines, linesEn };
}

/** Baut den vollständigen Material-Pass. */
export function buildMaterialPass(m: Material): MaterialPass {
  return {
    pflege: pflegeSection(m),
    haltbarkeit: haltbarkeitSection(m),
    eignung: eignungSection(m),
    nachhaltigkeit: nachhaltigkeitSection(m),
  };
}
