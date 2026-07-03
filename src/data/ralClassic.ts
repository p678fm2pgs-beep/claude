/**
 * HAVEN ATELIER — RAL-Classic-Palette (Erweiterung 6 · S4).
 * Alle 213 Töne: RAL-Nummer, deutscher Name, HEX-Annäherung (übliche sRGB-Werte).
 * Hinweis: HEX-Werte sind Bildschirm-Annäherungen — verbindlich ist ausschließlich
 * der physische RAL-Originalfächer.
 */

export interface RalTone {
  code: string; // z. B. "RAL 9010"
  name: string; // deutscher Name
  hex: string;
}

const R = (n: number, name: string, hex: string): RalTone => ({ code: `RAL ${n}`, name, hex });

export const RAL_CLASSIC: RalTone[] = [
  // ── 1000er · Gelb ──
  R(1000, 'Grünbeige', '#CCC58F'), R(1001, 'Beige', '#D1BC8A'), R(1002, 'Sandgelb', '#D2B773'),
  R(1003, 'Signalgelb', '#F7BA0B'), R(1004, 'Goldgelb', '#E2B007'), R(1005, 'Honiggelb', '#C89F04'),
  R(1006, 'Maisgelb', '#E1A100'), R(1007, 'Narzissengelb', '#E79C00'), R(1011, 'Braunbeige', '#AF8A54'),
  R(1012, 'Zitronengelb', '#D9C022'), R(1013, 'Perlweiß', '#E9E5CE'), R(1014, 'Elfenbein', '#DFCEA1'),
  R(1015, 'Hellelfenbein', '#EADEBD'), R(1016, 'Schwefelgelb', '#EAF044'), R(1017, 'Safrangelb', '#F4B752'),
  R(1018, 'Zinkgelb', '#F3E03B'), R(1019, 'Graubeige', '#A4957D'), R(1020, 'Olivgelb', '#9A9464'),
  R(1021, 'Rapsgelb', '#EEC900'), R(1023, 'Verkehrsgelb', '#F0CA00'), R(1024, 'Ockergelb', '#B89C50'),
  R(1026, 'Leuchtgelb', '#F5FF00'), R(1027, 'Currygelb', '#A98307'), R(1028, 'Melonengelb', '#FF9B00'),
  R(1032, 'Ginstergelb', '#DDB20F'), R(1033, 'Dahliengelb', '#FAAB21'), R(1034, 'Pastellgelb', '#EDAB56'),
  R(1035, 'Perlbeige', '#A29985'), R(1036, 'Perlgold', '#927549'), R(1037, 'Sonnengelb', '#EEA205'),
  // ── 2000er · Orange ──
  R(2000, 'Gelborange', '#DD7907'), R(2001, 'Rotorange', '#BE4E20'), R(2002, 'Blutorange', '#C63927'),
  R(2003, 'Pastellorange', '#FA842B'), R(2004, 'Reinorange', '#E75B12'), R(2005, 'Leuchtorange', '#FF2300'),
  R(2007, 'Leuchthellorange', '#FFA421'), R(2008, 'Hellrotorange', '#F3752C'), R(2009, 'Verkehrsorange', '#E15501'),
  R(2010, 'Signalorange', '#D4652F'), R(2011, 'Tieforange', '#EC7C25'), R(2012, 'Lachsorange', '#DB6A50'),
  R(2013, 'Perlorange', '#954527'),
  // ── 3000er · Rot ──
  R(3000, 'Feuerrot', '#AB2524'), R(3001, 'Signalrot', '#A02128'), R(3002, 'Karminrot', '#A1232B'),
  R(3003, 'Rubinrot', '#8D1D2C'), R(3004, 'Purpurrot', '#701F29'), R(3005, 'Weinrot', '#5E2028'),
  R(3007, 'Schwarzrot', '#402225'), R(3009, 'Oxidrot', '#703731'), R(3011, 'Braunrot', '#7E292C'),
  R(3012, 'Beigerot', '#CB8D73'), R(3013, 'Tomatenrot', '#9C322E'), R(3014, 'Altrosa', '#D47479'),
  R(3015, 'Hellrosa', '#E1A6AD'), R(3016, 'Korallenrot', '#AC4034'), R(3017, 'Rosé', '#D3545F'),
  R(3018, 'Erdbeerrot', '#D14152'), R(3020, 'Verkehrsrot', '#C1121C'), R(3022, 'Lachsrot', '#D56D56'),
  R(3024, 'Leuchtrot', '#F70000'), R(3026, 'Leuchthellrot', '#FF0000'), R(3027, 'Himbeerrot', '#B42041'),
  R(3028, 'Reinrot', '#CC2C24'), R(3031, 'Orientrot', '#B32821'), R(3032, 'Perlrubinrot', '#711521'),
  R(3033, 'Perlrosa', '#B24C43'),
  // ── 4000er · Violett ──
  R(4001, 'Rotlila', '#8A5A83'), R(4002, 'Rotviolett', '#933D50'), R(4003, 'Erikaviolett', '#D15B8F'),
  R(4004, 'Bordeauxviolett', '#691639'), R(4005, 'Blaulila', '#83639D'), R(4006, 'Verkehrspurpur', '#992572'),
  R(4007, 'Purpurviolett', '#4A203B'), R(4008, 'Signalviolett', '#904684'), R(4009, 'Pastellviolett', '#A38995'),
  R(4010, 'Telemagenta', '#C63678'), R(4011, 'Perlviolett', '#8773A1'), R(4012, 'Perlbrombeer', '#6B6880'),
  // ── 5000er · Blau ──
  R(5000, 'Violettblau', '#384C70'), R(5001, 'Grünblau', '#1F4764'), R(5002, 'Ultramarinblau', '#2B2C7C'),
  R(5003, 'Saphirblau', '#2A3756'), R(5004, 'Schwarzblau', '#1D1F2A'), R(5005, 'Signalblau', '#154889'),
  R(5007, 'Brillantblau', '#41678D'), R(5008, 'Graublau', '#313C48'), R(5009, 'Azurblau', '#2E5978'),
  R(5010, 'Enzianblau', '#13447C'), R(5011, 'Stahlblau', '#232C3F'), R(5012, 'Lichtblau', '#3481B8'),
  R(5013, 'Kobaltblau', '#232D53'), R(5014, 'Taubenblau', '#6C7C98'), R(5015, 'Himmelblau', '#2874B2'),
  R(5017, 'Verkehrsblau', '#0E518D'), R(5018, 'Türkisblau', '#21888F'), R(5019, 'Capriblau', '#1A5784'),
  R(5020, 'Ozeanblau', '#0B4151'), R(5021, 'Wasserblau', '#07737A'), R(5022, 'Nachtblau', '#2F2A5A'),
  R(5023, 'Fernblau', '#4D668E'), R(5024, 'Pastellblau', '#6A93B0'), R(5025, 'Perlenzian', '#296478'),
  R(5026, 'Perlnachtblau', '#102C54'),
  // ── 6000er · Grün ──
  R(6000, 'Patinagrün', '#327662'), R(6001, 'Smaragdgrün', '#28713E'), R(6002, 'Laubgrün', '#276235'),
  R(6003, 'Olivgrün', '#4B573E'), R(6004, 'Blaugrün', '#0E4243'), R(6005, 'Moosgrün', '#0F4336'),
  R(6006, 'Grauoliv', '#40433B'), R(6007, 'Flaschengrün', '#283424'), R(6008, 'Braungrün', '#35382E'),
  R(6009, 'Tannengrün', '#26392F'), R(6010, 'Grasgrün', '#3E753B'), R(6011, 'Resedagrün', '#68825B'),
  R(6012, 'Schwarzgrün', '#31403D'), R(6013, 'Schilfgrün', '#797C5A'), R(6014, 'Gelboliv', '#444337'),
  R(6015, 'Schwarzoliv', '#3D403A'), R(6016, 'Türkisgrün', '#026A52'), R(6017, 'Maigrün', '#468641'),
  R(6018, 'Gelbgrün', '#48A43F'), R(6019, 'Weißgrün', '#B7D9B1'), R(6020, 'Chromoxidgrün', '#354733'),
  R(6021, 'Blassgrün', '#86A47C'), R(6022, 'Braunoliv', '#3E3C32'), R(6024, 'Verkehrsgrün', '#008754'),
  R(6025, 'Farngrün', '#53753C'), R(6026, 'Opalgrün', '#005D52'), R(6027, 'Lichtgrün', '#81C0BB'),
  R(6028, 'Kieferngrün', '#2D5546'), R(6029, 'Minzgrün', '#007243'), R(6032, 'Signalgrün', '#0F7648'),
  R(6033, 'Minttürkis', '#478A84'), R(6034, 'Pastelltürkis', '#7FB0B2'), R(6035, 'Perlgrün', '#1B542C'),
  R(6036, 'Perlopalgrün', '#005D4C'), R(6037, 'Reingrün', '#25E712'), R(6038, 'Leuchtgrün', '#00F700'),
  // ── 7000er · Grau ──
  R(7000, 'Fehgrau', '#7E8B92'), R(7001, 'Silbergrau', '#8F999F'), R(7002, 'Olivgrau', '#817F68'),
  R(7003, 'Moosgrau', '#7A7B6D'), R(7004, 'Signalgrau', '#9EA0A1'), R(7005, 'Mausgrau', '#6B716F'),
  R(7006, 'Beigegrau', '#756F61'), R(7008, 'Khakigrau', '#746643'), R(7009, 'Grüngrau', '#5B6259'),
  R(7010, 'Zeltgrau', '#575D57'), R(7011, 'Eisengrau', '#555D61'), R(7012, 'Basaltgrau', '#596163'),
  R(7013, 'Braungrau', '#555548'), R(7015, 'Schiefergrau', '#51565C'), R(7016, 'Anthrazitgrau', '#373F43'),
  R(7021, 'Schwarzgrau', '#2E3234'), R(7022, 'Umbragrau', '#4B4D46'), R(7023, 'Betongrau', '#818479'),
  R(7024, 'Graphitgrau', '#474A50'), R(7026, 'Granitgrau', '#374447'), R(7030, 'Steingrau', '#939388'),
  R(7031, 'Blaugrau', '#5D6970'), R(7032, 'Kieselgrau', '#B9B9A8'), R(7033, 'Zementgrau', '#818979'),
  R(7034, 'Gelbgrau', '#939176'), R(7035, 'Lichtgrau', '#CBD0CC'), R(7036, 'Platingrau', '#9A9697'),
  R(7037, 'Staubgrau', '#7C7F7E'), R(7038, 'Achatgrau', '#B4B8B0'), R(7039, 'Quarzgrau', '#6B695F'),
  R(7040, 'Fenstergrau', '#9DA3A6'), R(7042, 'Verkehrsgrau A', '#8F9695'), R(7043, 'Verkehrsgrau B', '#4E5451'),
  R(7044, 'Seidengrau', '#BDBDB2'), R(7045, 'Telegrau 1', '#91969A'), R(7046, 'Telegrau 2', '#82898E'),
  R(7047, 'Telegrau 4', '#CFD0CF'), R(7048, 'Perlmausgrau', '#888175'),
  // ── 8000er · Braun ──
  R(8000, 'Grünbraun', '#887142'), R(8001, 'Ockerbraun', '#9C6B30'), R(8002, 'Signalbraun', '#7B5141'),
  R(8003, 'Lehmbraun', '#80542F'), R(8004, 'Kupferbraun', '#8F4E35'), R(8007, 'Rehbraun', '#6F4A2F'),
  R(8008, 'Olivbraun', '#6F4F28'), R(8011, 'Nussbraun', '#5A3A29'), R(8012, 'Rotbraun', '#673831'),
  R(8014, 'Sepiabraun', '#49392D'), R(8015, 'Kastanienbraun', '#633A34'), R(8016, 'Mahagonibraun', '#4C2F26'),
  R(8017, 'Schokoladenbraun', '#44322D'), R(8019, 'Graubraun', '#3F3A3A'), R(8022, 'Schwarzbraun', '#211F20'),
  R(8023, 'Orangebraun', '#A65E2F'), R(8024, 'Beigebraun', '#79553C'), R(8025, 'Blassbraun', '#755C49'),
  R(8028, 'Terrabraun', '#4E3B31'), R(8029, 'Perlkupfer', '#763C28'),
  // ── 9000er · Weiß / Schwarz ──
  R(9001, 'Cremeweiß', '#EFEBDC'), R(9002, 'Grauweiß', '#DDDED4'), R(9003, 'Signalweiß', '#F4F8F4'),
  R(9004, 'Signalschwarz', '#2E3032'), R(9005, 'Tiefschwarz', '#0A0A0D'), R(9006, 'Weißaluminium', '#A5A8A6'),
  R(9007, 'Graualuminium', '#8F8F8C'), R(9010, 'Reinweiß', '#F7F9EF'), R(9011, 'Graphitschwarz', '#292C2F'),
  R(9016, 'Verkehrsweiß', '#F7FBF5'), R(9017, 'Verkehrsschwarz', '#2A292A'), R(9018, 'Papyrusweiß', '#CFD3CD'),
  R(9022, 'Perlhellgrau', '#9C9C9C'), R(9023, 'Perldunkelgrau', '#7E8182'),
];

/** Gruppierung nach Farbreihe (1000er … 9000er) für die Browser-Ansicht. */
export const RAL_GROUPS: { id: string; label: string; test: (code: string) => boolean }[] = [
  { id: 'ral-1', label: 'Gelb (1000er)', test: (c) => c.startsWith('RAL 1') },
  { id: 'ral-2', label: 'Orange (2000er)', test: (c) => c.startsWith('RAL 2') },
  { id: 'ral-3', label: 'Rot (3000er)', test: (c) => c.startsWith('RAL 3') },
  { id: 'ral-4', label: 'Violett (4000er)', test: (c) => c.startsWith('RAL 4') },
  { id: 'ral-5', label: 'Blau (5000er)', test: (c) => c.startsWith('RAL 5') },
  { id: 'ral-6', label: 'Grün (6000er)', test: (c) => c.startsWith('RAL 6') },
  { id: 'ral-7', label: 'Grau (7000er)', test: (c) => c.startsWith('RAL 7') },
  { id: 'ral-8', label: 'Braun (8000er)', test: (c) => c.startsWith('RAL 8') },
  { id: 'ral-9', label: 'Weiß & Schwarz (9000er)', test: (c) => c.startsWith('RAL 9') },
];
