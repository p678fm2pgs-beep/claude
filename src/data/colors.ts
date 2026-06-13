/**
 * HAVEN ATELIER — Farb-Bibliothek.
 * 12 Familien mit je ≥10 benannten Tönen.
 * Jeder Ton: deutscher Name, HEX, nächster RAL-Classic, nächster NCS, LRV, Unterton.
 * Anker: Reinweiß ≈ RAL 9010, Cremeweiß ≈ RAL 9001, Verkehrsweiß ≈ RAL 9016, Anthrazit ≈ RAL 7016.
 * Hinweis: RAL/NCS sind Annäherungen — verbindlich nur das physische Originalmuster.
 */
import type { Untertone } from '../types';

export interface ColorTone {
  id: string;
  name: string;
  nameEn: string;
  hex: string;
  ral: string;
  ncs: string;
  lrv: number;
  undertone: Untertone;
  familyId: string;
}

export interface ColorFamily {
  id: string;
  name: string;
  nameEn: string;
  tones: ColorTone[];
}

type Raw = [name: string, nameEn: string, hex: string, ral: string, ncs: string, lrv: number, ut: Untertone];

function fam(id: string, name: string, nameEn: string, rows: Raw[]): ColorFamily {
  return {
    id,
    name,
    nameEn,
    tones: rows.map((r, i) => ({
      id: `${id}-${i + 1}`,
      name: r[0],
      nameEn: r[1],
      hex: r[2],
      ral: r[3],
      ncs: r[4],
      lrv: r[5],
      undertone: r[6],
      familyId: id,
    })),
  };
}

export const COLOR_FAMILIES: ColorFamily[] = [
  fam('weiss', 'Weiß', 'White', [
    ['Reinweiß', 'Pure White', '#F4F4F2', 'RAL 9010', 'S 0500-N', 88, 'neutral'],
    ['Verkehrsweiß', 'Traffic White', '#F1F1F0', 'RAL 9016', 'S 0300-N', 90, 'kuehl'],
    ['Eiweiß', 'Egg White', '#F2EFE6', 'RAL 9001', 'S 0505-Y20R', 84, 'warm'],
    ['Wollweiß', 'Wool White', '#EEE9DC', 'RAL 9001', 'S 0907-Y20R', 80, 'warm'],
    ['Altweiß', 'Old White', '#EDE7D9', 'RAL 9001', 'S 1005-Y20R', 78, 'warm'],
    ['Kreideweiß', 'Chalk White', '#F0EDE6', 'RAL 9003', 'S 0502-Y', 85, 'neutral'],
    ['Alabaster', 'Alabaster', '#EFEBE2', 'RAL 9010', 'S 0804-Y10R', 82, 'warm'],
    ['Schneeweiß', 'Snow White', '#F6F6F4', 'RAL 9003', 'S 0500-N', 91, 'kuehl'],
    ['Perlweiß', 'Pearl White', '#ECE9E1', 'RAL 1013', 'S 1002-Y', 80, 'neutral'],
    ['Naturweiß', 'Natural White', '#EAE4D6', 'RAL 9001', 'S 1010-Y10R', 76, 'warm'],
  ]),
  fam('creme', 'Creme / Beige', 'Cream / Beige', [
    ['Cremeweiß', 'Cream White', '#EDE3CC', 'RAL 9001', 'S 1015-Y20R', 73, 'warm'],
    ['Vanille', 'Vanilla', '#EADFC4', 'RAL 1015', 'S 1510-Y20R', 70, 'warm'],
    ['Sandbeige', 'Sand Beige', '#DFD2B4', 'RAL 1014', 'S 2010-Y20R', 62, 'warm'],
    ['Champagner', 'Champagne', '#E4D8BE', 'RAL 1014', 'S 1515-Y20R', 66, 'warm'],
    ['Leinen', 'Linen', '#E2D9C3', 'RAL 1013', 'S 1510-Y10R', 68, 'neutral'],
    ['Muschel', 'Shell', '#E8DFCB', 'RAL 9001', 'S 1205-Y20R', 71, 'warm'],
    ['Karamell-Hell', 'Light Caramel', '#D8C49E', 'RAL 1001', 'S 2020-Y20R', 55, 'warm'],
    ['Hafer', 'Oat', '#DDD0B2', 'RAL 1014', 'S 2015-Y20R', 60, 'warm'],
    ['Elfenbein', 'Ivory', '#E9E0C8', 'RAL 1015', 'S 1510-Y', 72, 'warm'],
    ['Dünensand', 'Dune Sand', '#D4C39C', 'RAL 1002', 'S 2020-Y20R', 53, 'warm'],
  ]),
  fam('greige', 'Greige', 'Greige', [
    ['Greige Hell', 'Light Greige', '#D8D0C3', 'RAL 7044', 'S 2005-Y20R', 64, 'neutral'],
    ['Steingrau-Warm', 'Warm Stone', '#C9BFB0', 'RAL 7032', 'S 3005-Y20R', 55, 'warm'],
    ['Taupe', 'Taupe', '#B6AB9A', 'RAL 7006', 'S 4005-Y20R', 44, 'warm'],
    ['Lehmgreige', 'Clay Greige', '#C2B6A4', 'RAL 1019', 'S 3010-Y20R', 49, 'warm'],
    ['Nebelgreige', 'Foggy Greige', '#CFC8BB', 'RAL 7038', 'S 2502-Y', 60, 'neutral'],
    ['Pilzgrau', 'Mushroom', '#B3A998', 'RAL 7006', 'S 4010-Y20R', 43, 'warm'],
    ['Kaschmir', 'Cashmere', '#CBC0AE', 'RAL 1019', 'S 3010-Y10R', 53, 'warm'],
    ['Treibholz', 'Driftwood', '#ABA191', 'RAL 7048', 'S 4005-Y20R', 40, 'neutral'],
    ['Sandstein-Grau', 'Sandstone Grey', '#BEB4A4', 'RAL 7032', 'S 3505-Y20R', 47, 'warm'],
    ['Perlgreige', 'Pearl Greige', '#D3CBBE', 'RAL 7044', 'S 2502-Y', 61, 'neutral'],
  ]),
  fam('grau', 'Grau', 'Grey', [
    ['Lichtgrau', 'Light Grey', '#CFCFCF', 'RAL 7035', 'S 2000-N', 62, 'neutral'],
    ['Seidengrau', 'Silk Grey', '#C2C3C1', 'RAL 7044', 'S 2500-N', 56, 'kuehl'],
    ['Kieselgrau', 'Pebble Grey', '#B6B5B0', 'RAL 7032', 'S 3000-N', 48, 'neutral'],
    ['Nebelgrau', 'Mist Grey', '#B9BDBE', 'RAL 7038', 'S 2502-B', 50, 'kuehl'],
    ['Zementgrau', 'Cement Grey', '#9FA0A0', 'RAL 7037', 'S 4000-N', 37, 'kuehl'],
    ['Taubengrau', 'Dove Grey', '#A7A6A2', 'RAL 7038', 'S 3502-Y', 40, 'neutral'],
    ['Basaltgrau-Hell', 'Light Basalt', '#8E8F8E', 'RAL 7037', 'S 4500-N', 30, 'kuehl'],
    ['Schiefergrau', 'Slate Grey', '#7C8082', 'RAL 7015', 'S 5000-N', 22, 'kuehl'],
    ['Quarzgrau', 'Quartz Grey', '#90918E', 'RAL 7039', 'S 4502-Y', 31, 'neutral'],
    ['Flanellgrau', 'Flannel Grey', '#A3A39E', 'RAL 7036', 'S 3502-Y', 38, 'neutral'],
  ]),
  fam('anthrazit', 'Schwarz / Anthrazit', 'Black / Anthracite', [
    ['Anthrazit', 'Anthracite', '#383B3D', 'RAL 7016', 'S 8000-N', 6, 'kuehl'],
    ['Graphit', 'Graphite', '#414446', 'RAL 7024', 'S 7500-N', 8, 'kuehl'],
    ['Basaltschwarz', 'Basalt Black', '#2E3133', 'RAL 7021', 'S 8502-B', 4, 'kuehl'],
    ['Tiefschwarz', 'Deep Black', '#1C1C1C', 'RAL 9005', 'S 9000-N', 3, 'neutral'],
    ['Eisenglimmer', 'Iron Mica', '#454A4D', 'RAL 7024', 'S 7502-B', 9, 'kuehl'],
    ['Rußbraun-Schwarz', 'Soot', '#2B2825', 'RAL 8022', 'S 8505-Y20R', 3, 'warm'],
    ['Nachtblau-Schwarz', 'Night Black', '#26292E', 'RAL 5004', 'S 8505-R80B', 4, 'kuehl'],
    ['Schiefer-Anthrazit', 'Slate Anthracite', '#3B4042', 'RAL 7015', 'S 7502-B', 7, 'kuehl'],
    ['Mattschwarz', 'Matte Black', '#222222', 'RAL 9005', 'S 8500-N', 3, 'neutral'],
    ['Pechgrau', 'Pitch Grey', '#33373A', 'RAL 7016', 'S 8005-B20G', 5, 'kuehl'],
  ]),
  fam('braun', 'Braun / Erde', 'Brown / Earth', [
    ['Sandbraun', 'Sand Brown', '#A98F6F', 'RAL 1011', 'S 4020-Y20R', 35, 'warm'],
    ['Karamell', 'Caramel', '#9B6F47', 'RAL 8001', 'S 4040-Y30R', 22, 'warm'],
    ['Nussbraun', 'Walnut Brown', '#6F4E37', 'RAL 8007', 'S 6030-Y30R', 12, 'warm'],
    ['Schokobraun', 'Chocolate', '#4E342A', 'RAL 8017', 'S 7020-Y50R', 6, 'warm'],
    ['Lehmbraun', 'Clay Brown', '#8A6A4F', 'RAL 8024', 'S 5030-Y30R', 17, 'warm'],
    ['Espresso', 'Espresso', '#3D2B23', 'RAL 8022', 'S 8010-Y50R', 4, 'warm'],
    ['Tabak', 'Tobacco', '#7A5A3A', 'RAL 8008', 'S 5040-Y30R', 14, 'warm'],
    ['Cognac', 'Cognac', '#915E33', 'RAL 8003', 'S 4050-Y40R', 18, 'warm'],
    ['Haselnuss', 'Hazelnut', '#B08D5E', 'RAL 1011', 'S 3030-Y30R', 33, 'warm'],
    ['Erdbraun', 'Earth Brown', '#5E463A', 'RAL 8025', 'S 6020-Y50R', 9, 'warm'],
  ]),
  fam('terrakotta', 'Terrakotta / Rost', 'Terracotta / Rust', [
    ['Terrakotta', 'Terracotta', '#C16E4F', 'RAL 8004', 'S 3040-Y60R', 30, 'warm'],
    ['Rostorange', 'Rust Orange', '#B05B3B', 'RAL 8023', 'S 4050-Y70R', 24, 'warm'],
    ['Ziegelrot', 'Brick Red', '#9E4A38', 'RAL 8004', 'S 4550-Y80R', 18, 'warm'],
    ['Ton-Rosé', 'Clay Rose', '#CC8B71', 'RAL 3012', 'S 3020-Y70R', 40, 'warm'],
    ['Paprika', 'Paprika', '#A84F36', 'RAL 8004', 'S 4050-Y70R', 20, 'warm'],
    ['Kupferrot', 'Copper Red', '#B5663F', 'RAL 8023', 'S 4040-Y60R', 27, 'warm'],
    ['Sienna', 'Sienna', '#9C5A3C', 'RAL 8003', 'S 4040-Y50R', 22, 'warm'],
    ['Lachston', 'Salmon Clay', '#D2937A', 'RAL 3012', 'S 2030-Y70R', 45, 'warm'],
    ['Rostbraun', 'Rust Brown', '#8C4A30', 'RAL 8004', 'S 5040-Y60R', 15, 'warm'],
    ['Mohnrot-Erdig', 'Earthy Poppy', '#A14430', 'RAL 3016', 'S 4050-Y80R', 17, 'warm'],
  ]),
  fam('bordeaux', 'Rot / Bordeaux', 'Red / Bordeaux', [
    ['Bordeaux', 'Bordeaux', '#5E2B33', 'RAL 3005', 'S 6030-R10B', 7, 'kuehl'],
    ['Weinrot', 'Wine Red', '#6E2A36', 'RAL 3005', 'S 5040-R10B', 9, 'kuehl'],
    ['Karminrot', 'Carmine', '#8E2B36', 'RAL 3027', 'S 3060-R', 13, 'neutral'],
    ['Rubin', 'Ruby', '#7A2233', 'RAL 3003', 'S 4050-R', 10, 'kuehl'],
    ['Backsteinrot', 'Brick Red', '#92403A', 'RAL 3011', 'S 4050-Y90R', 16, 'warm'],
    ['Granatrot', 'Garnet', '#5A2230', 'RAL 3005', 'S 6030-R10B', 6, 'kuehl'],
    ['Mahagonirot', 'Mahogany', '#6B3030', 'RAL 3009', 'S 5040-Y80R', 9, 'warm'],
    ['Kirschrot', 'Cherry', '#9B2335', 'RAL 3028', 'S 2070-R', 14, 'neutral'],
    ['Purpurrot', 'Purple Red', '#6A2740', 'RAL 4002', 'S 5030-R20B', 8, 'kuehl'],
    ['Altrot', 'Antique Red', '#84413F', 'RAL 3013', 'S 4040-Y90R', 15, 'warm'],
  ]),
  fam('ocker', 'Gelb / Ocker', 'Yellow / Ochre', [
    ['Ocker', 'Ochre', '#C99A3B', 'RAL 1024', 'S 3040-Y20R', 40, 'warm'],
    ['Senfgelb', 'Mustard', '#C7A12C', 'RAL 1032', 'S 3050-Y', 42, 'warm'],
    ['Goldgelb', 'Golden Yellow', '#D6A93C', 'RAL 1004', 'S 2060-Y10R', 47, 'warm'],
    ['Honiggelb', 'Honey', '#DDB659', 'RAL 1017', 'S 2040-Y10R', 55, 'warm'],
    ['Safran', 'Saffron', '#D29A33', 'RAL 1024', 'S 3050-Y20R', 41, 'warm'],
    ['Strohgelb', 'Straw', '#E0CB7E', 'RAL 1002', 'S 2030-Y', 65, 'warm'],
    ['Currygelb', 'Curry', '#BD9128', 'RAL 1027', 'S 3060-Y10R', 36, 'warm'],
    ['Sonnengelb', 'Sun Yellow', '#E4BC4A', 'RAL 1023', 'S 1060-Y10R', 58, 'warm'],
    ['Messinggelb', 'Brass Yellow', '#C2A14E', 'RAL 1024', 'S 3040-Y10R', 45, 'warm'],
    ['Amber', 'Amber', '#C88A2C', 'RAL 1024', 'S 3050-Y30R', 37, 'warm'],
  ]),
  fam('gruen', 'Grün / Salbei / Oliv', 'Green / Sage / Olive', [
    ['Salbeigrün', 'Sage Green', '#A8B49A', 'RAL 6021', 'S 3020-G50Y', 47, 'neutral'],
    ['Olivgrün', 'Olive Green', '#6E7245', 'RAL 6013', 'S 5030-G70Y', 19, 'warm'],
    ['Moosgrün', 'Moss Green', '#4F5B3C', 'RAL 6003', 'S 6020-G50Y', 12, 'warm'],
    ['Eukalyptus', 'Eucalyptus', '#8C9C8A', 'RAL 6021', 'S 3010-G', 35, 'kuehl'],
    ['Tannengrün', 'Fir Green', '#33503F', 'RAL 6009', 'S 7020-G10Y', 8, 'kuehl'],
    ['Resedagrün', 'Reseda Green', '#7E8B62', 'RAL 6011', 'S 4030-G60Y', 28, 'warm'],
    ['Schilfgrün', 'Reed Green', '#9BA67E', 'RAL 6013', 'S 3030-G60Y', 38, 'warm'],
    ['Flaschengrün', 'Bottle Green', '#2E4636', 'RAL 6005', 'S 7020-G', 6, 'kuehl'],
    ['Lindgrün-Gedeckt', 'Muted Lime', '#9FAE78', 'RAL 6021', 'S 3040-G60Y', 40, 'warm'],
    ['Graugrün', 'Grey Green', '#7B8778', 'RAL 7009', 'S 4010-G', 26, 'neutral'],
  ]),
  fam('blau', 'Blau / Petrol', 'Blue / Petrol', [
    ['Petrol', 'Petrol', '#2E5961', 'RAL 5020', 'S 6020-B30G', 12, 'kuehl'],
    ['Taubenblau', 'Dove Blue', '#7E94A0', 'RAL 5014', 'S 4010-B', 30, 'kuehl'],
    ['Marineblau', 'Navy Blue', '#2A3A55', 'RAL 5011', 'S 7020-R80B', 7, 'kuehl'],
    ['Stahlblau', 'Steel Blue', '#4A6473', 'RAL 5008', 'S 6010-B', 18, 'kuehl'],
    ['Rauchblau', 'Smoke Blue', '#8FA0AB', 'RAL 5014', 'S 3010-B', 36, 'kuehl'],
    ['Tintenblau', 'Ink Blue', '#26344A', 'RAL 5004', 'S 8010-R70B', 5, 'kuehl'],
    ['Eisblau', 'Ice Blue', '#B6C6CC', 'RAL 5024', 'S 2010-B', 56, 'kuehl'],
    ['Jeansblau', 'Denim Blue', '#5A7488', 'RAL 5007', 'S 5020-B', 23, 'kuehl'],
    ['Mitternachtsblau', 'Midnight Blue', '#1F2A40', 'RAL 5011', 'S 8505-R80B', 4, 'kuehl'],
    ['Graublau', 'Grey Blue', '#6E808C', 'RAL 5008', 'S 5005-B', 26, 'kuehl'],
  ]),
  fam('rose', 'Rosé / Puder', 'Rosé / Powder', [
    ['Puderrosé', 'Powder Rose', '#E3CFC6', 'RAL 3015', 'S 1510-Y90R', 70, 'warm'],
    ['Altrosa', 'Antique Pink', '#C99B97', 'RAL 3012', 'S 2020-Y90R', 45, 'warm'],
    ['Nude', 'Nude', '#DCC2B2', 'RAL 1015', 'S 2010-Y50R', 60, 'warm'],
    ['Mauve', 'Mauve', '#B49AA0', 'RAL 4009', 'S 3010-R30B', 40, 'kuehl'],
    ['Rosenholz', 'Rosewood', '#B98C84', 'RAL 3012', 'S 3020-Y90R', 33, 'warm'],
    ['Pudergrau-Rosé', 'Powder Greige', '#CBB6B0', 'RAL 3015', 'S 2010-Y90R', 50, 'neutral'],
    ['Lachsrosa', 'Salmon Pink', '#E0B4A2', 'RAL 3012', 'S 2020-Y70R', 56, 'warm'],
    ['Trockenrose', 'Dusty Rose', '#C2A0A0', 'RAL 3012', 'S 2020-R', 43, 'neutral'],
    ['Apricot-Puder', 'Apricot Powder', '#E6C4AE', 'RAL 1015', 'S 1515-Y50R', 62, 'warm'],
    ['Beerenrosé', 'Berry Rose', '#B98592', 'RAL 3014', 'S 3020-R10B', 35, 'kuehl'],
  ]),
];

export const ALL_TONES: ColorTone[] = COLOR_FAMILIES.flatMap((f) => f.tones);

export function findTone(id: string | undefined): ColorTone | undefined {
  if (!id) return undefined;
  return ALL_TONES.find((t) => t.id === id);
}

export function findFamily(id: string): ColorFamily | undefined {
  return COLOR_FAMILIES.find((f) => f.id === id);
}
