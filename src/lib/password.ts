/**
 * HAVEN ATELIER — Passwort-Hashing & Passphrase-Generierung.
 * Komplett clientseitig via Web Crypto (PBKDF2/SHA-256). Klartext wird nie persistiert.
 * Geräteschutz; echtes Multi-User-Login folgt mit Backend (Roadmap).
 */

const ITERATIONS = 150_000;
const KEY_LEN = 32;

export interface StoredHash {
  saltHex: string;
  hashHex: string;
  iterations: number;
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.substr(i * 2, 2), 16);
  return arr;
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    keyMaterial,
    KEY_LEN * 8,
  );
  return toHex(bits);
}

export async function hashPassword(password: string): Promise<StoredHash> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hashHex = await pbkdf2(password, salt, ITERATIONS);
  return { saltHex: toHex(salt.buffer), hashHex, iterations: ITERATIONS };
}

export async function verifyPassword(password: string, stored: StoredHash): Promise<boolean> {
  const salt = fromHex(stored.saltHex);
  const hashHex = await pbkdf2(password, salt, stored.iterations);
  // Konstante-Zeit-Vergleich.
  if (hashHex.length !== stored.hashHex.length) return false;
  let diff = 0;
  for (let i = 0; i < hashHex.length; i++) diff |= hashHex.charCodeAt(i) ^ stored.hashHex.charCodeAt(i);
  return diff === 0;
}

const WORDS = [
  'Atelier', 'Marmor', 'Travertin', 'Eiche', 'Messing', 'Salbei', 'Petrol', 'Bordeaux',
  'Alabaster', 'Anthrazit', 'Leinen', 'Bronze', 'Nussbaum', 'Kalkputz', 'Bouclé', 'Chevron',
  'Ocker', 'Greige', 'Terrakotta', 'Onyx', 'Samt', 'Kupfer', 'Schiefer', 'Esche',
];

/** Erzeugt eine lesbare, sichere Passphrase „Wort-Wort-Zahl" (≥ 12 Zeichen). */
export function generatePassphrase(): string {
  const rand = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
  let phrase = '';
  do {
    const w1 = WORDS[rand(WORDS.length)];
    let w2 = WORDS[rand(WORDS.length)];
    while (w2 === w1) w2 = WORDS[rand(WORDS.length)];
    const num = 100 + rand(900);
    phrase = `${w1}-${w2}-${num}`;
  } while (phrase.length < 12);
  return phrase;
}

/** Zwei garantiert verschiedene Passphrasen. */
export function generateTwoPassphrases(): { start: string; expert: string } {
  const start = generatePassphrase();
  let expert = generatePassphrase();
  while (expert === start) expert = generatePassphrase();
  return { start, expert };
}
