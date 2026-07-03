/**
 * HAVEN ATELIER — Musterbestell-Liste (Erweiterung 6 · S12).
 * Sammelt alle physisch zu bestellenden Muster des Projekts:
 * Materialien (je Raum/Fläche) und Farbtöne (je Raum/Rolle) — dedupliziert,
 * mit Codes (RAL/NCS) für die Bestellung. Export als CSV; PDF im Lookbook-Modul.
 * Kundensicher: enthält ausschließlich VK-freie Angaben (keine Preise, kein EK).
 */
import type { Project, ColorRole } from '../types';
import { findMaterial } from '../data/materials';
import { findTone } from '../data/colors';

export interface SampleRow {
  /** 'material' | 'farbton' */
  art: 'material' | 'farbton';
  name: string;
  /** Bestell-Referenz: Subkategorie bzw. RAL/NCS-Code. */
  referenz: string;
  raum: string;
  /** Fläche (Boden/Wand/…) bzw. Farbrolle (Wand/Decke/…). */
  einsatz: string;
  /** Ausführung (Finish/Muster) — nur bei Materialien. */
  ausfuehrung: string;
}

const ROLE_LABEL: Record<string, string> = {
  wand: 'Wand',
  decke: 'Decke',
  boden: 'Boden',
  akzent: 'Akzent',
  textil: 'Textil',
};

/** Baut die deduplizierte Muster-Liste über alle Räume (aktive Variante je Raum). */
export function buildSampleList(project: Project): SampleRow[] {
  const rows: SampleRow[] = [];
  const seen = new Set<string>();

  for (const room of project.rooms) {
    const v = room.variants.find((x) => x.id === room.activeVariantId) ?? room.variants[0];
    if (!v) continue;

    for (const sel of v.materials) {
      const m = findMaterial(sel.materialId);
      if (!m) continue;
      const ausfuehrung = [sel.finish, sel.pattern, sel.woodSpecies].filter(Boolean).join(' · ');
      const key = `m|${m.id}|${ausfuehrung}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({
        art: 'material',
        name: m.name,
        referenz: `${m.category} / ${m.subcategory}`,
        raum: room.name,
        einsatz: ROLE_LABEL[sel.surface] ?? sel.surface,
        ausfuehrung,
      });
    }

    for (const [role, toneId] of Object.entries(v.colorRoles) as [ColorRole, string | undefined][]) {
      const tone = findTone(toneId);
      if (!tone) continue;
      const key = `t|${tone.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const codes = [tone.ral !== '—' ? tone.ral : '', tone.ncs !== '—' ? tone.ncs : '']
        .filter(Boolean)
        .join(' · ');
      rows.push({
        art: 'farbton',
        name: tone.name,
        referenz: codes || tone.hex,
        raum: room.name,
        einsatz: ROLE_LABEL[role] ?? role,
        ausfuehrung: '',
      });
    }
  }
  return rows;
}

/** CSV-Feld sicher quoten (Semikolon-getrennt, deutsches Excel-freundlich). */
function csvField(s: string): string {
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Serialisiert die Liste als CSV (Semikolon, UTF-8 mit BOM für Excel). */
export function sampleListCsv(rows: SampleRow[]): string {
  const head = ['Art', 'Name', 'Referenz', 'Raum', 'Einsatz', 'Ausführung'];
  const lines = [head.join(';')];
  for (const r of rows) {
    lines.push(
      [
        r.art === 'material' ? 'Material' : 'Farbton',
        r.name,
        r.referenz,
        r.raum,
        r.einsatz,
        r.ausfuehrung,
      ]
        .map(csvField)
        .join(';'),
    );
  }
  return '\uFEFF' + lines.join('\n');
}

/** Löst den CSV-Download aus. */
export function downloadSampleCsv(project: Project): void {
  const csv = sampleListCsv(buildSampleList(project));
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `HAVEN_Musterliste_${project.name.replace(/\s+/g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
