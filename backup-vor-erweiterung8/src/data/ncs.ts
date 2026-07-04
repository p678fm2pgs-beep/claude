/**
 * HAVEN ATELIER — NCS-Auswahl (Erweiterung 6 · S5).
 * Strukturierte, im Innenraum gängige NCS-Töne (Schwärzung/Buntheit × Farbton) mit HEX-Annäherung.
 * Hinweis: Bildschirm-Annäherung — verbindlich ist ausschließlich der NCS-Originalfächer.
 */

export interface NcsTone {
  code: string; // z. B. "S 1005-Y20R"
  hex: string;
}

const N = (code: string, hex: string): NcsTone => ({ code: `S ${code}`, hex });

export const NCS_TONES: NcsTone[] = [
  // ── Neutrale (N) — die Grau-Treppe ──
  N('0300-N', '#F4F4F1'), N('0500-N', '#EFEFEC'), N('1000-N', '#E2E2DF'), N('1500-N', '#D5D5D2'),
  N('2000-N', '#C8C8C5'), N('2500-N', '#BABAB7'), N('3000-N', '#ACACA9'), N('3500-N', '#9E9E9B'),
  N('4000-N', '#909090'), N('4500-N', '#828282'), N('5000-N', '#747474'), N('5500-N', '#666666'),
  N('6000-N', '#585858'), N('6500-N', '#4A4A4A'), N('7000-N', '#3D3D3D'), N('7500-N', '#303030'),
  N('8000-N', '#242424'), N('8500-N', '#1A1A1A'), N('9000-N', '#111111'),
  // ── Warme Weiß-/Beige-Achse (Y…Y30R) ──
  N('0502-Y', '#F2F0E6'), N('0505-Y20R', '#F1EBDD'), N('0507-Y20R', '#F0E8D5'), N('0804-Y10R', '#ECE6D6'),
  N('1002-Y', '#E6E2D4'), N('1005-Y20R', '#E4DCC8'), N('1010-Y10R', '#E1D5B9'), N('1015-Y20R', '#DFCFAC'),
  N('1510-Y20R', '#D9CBB0'), N('2005-Y20R', '#CFC5AF'), N('2010-Y20R', '#CBBD9F'), N('2020-Y20R', '#C6B288'),
  N('3010-Y20R', '#B3A88D'), N('3020-Y20R', '#AF9D75'), N('4010-Y20R', '#988E75'), N('5010-Y30R', '#7E7460'),
  // ── Rot-/Terra-Achse (Y50R…R) ──
  N('1515-Y50R', '#E3C4A6'), N('2020-Y50R', '#CFA983'), N('3030-Y60R', '#B57F58'), N('4040-Y70R', '#9C5A38'),
  N('2030-Y90R', '#C89189'), N('3040-Y80R', '#AE6A50'), N('4050-Y80R', '#94402B'), N('5040-Y80R', '#743527'),
  N('2020-R', '#CBA09E'), N('3020-R10B', '#AE8590'), N('4030-R10B', '#8E5E6B'), N('5030-R10B', '#6E4451'),
  // ── Blau-Achse (R80B…B) ──
  N('1010-R90B', '#CBD5DF'), N('2010-R90B', '#B3C0CE'), N('3020-R80B', '#8C9CB4'), N('4020-R80B', '#75859D'),
  N('5020-R80B', '#5C6C84'), N('6020-R80B', '#45536A'), N('7020-R80B', '#303C51'), N('2005-B', '#BFC7CB'),
  N('3010-B', '#9FACB3'), N('4010-B', '#8A979E'), N('5020-B', '#5F7480'), N('6020-B30G', '#3F5B60'),
  // ── Grün-Achse (B50G…G50Y) ──
  N('2010-B50G', '#AFC2BE'), N('3020-B50G', '#84A49E'), N('4030-B30G', '#5B8480'), N('5030-B30G', '#42696A'),
  N('1510-G20Y', '#CFD8C0'), N('2020-G30Y', '#B1BF95'), N('3020-G50Y', '#A7AE89'), N('4030-G50Y', '#84895C'),
  N('5030-G70Y', '#6E6A42'), N('6020-G50Y', '#575C42'), N('7020-G10Y', '#3B4A3F'),
  // ── Gelb-/Ocker-Achse ──
  N('1030-Y', '#E9D384'), N('2040-Y', '#D6B252'), N('3050-Y', '#BC9430'), N('2040-Y10R', '#D9A94F'),
  N('3050-Y20R', '#B87F30'), N('1020-Y10R', '#E7D5A6'),
];
