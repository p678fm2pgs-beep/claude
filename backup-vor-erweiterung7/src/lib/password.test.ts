import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateTwoPassphrases, generatePassphrase } from './password';

describe('Passwort-Hashing', () => {
  it('verifiziert das korrekte Passwort und lehnt falsche ab', async () => {
    const stored = await hashPassword('Atelier-Marmor-742');
    expect(await verifyPassword('Atelier-Marmor-742', stored)).toBe(true);
    expect(await verifyPassword('falsch', stored)).toBe(false);
  });

  it('Klartext wird nicht im Hash gespeichert', async () => {
    const stored = await hashPassword('GeheimesWort-123');
    expect(JSON.stringify(stored)).not.toContain('GeheimesWort');
  });

  it('zwei verschiedene Salts → verschiedene Hashes für gleiches Passwort', async () => {
    const a = await hashPassword('gleich');
    const b = await hashPassword('gleich');
    expect(a.hashHex).not.toBe(b.hashHex);
  });
});

describe('Passphrase-Generierung', () => {
  it('Format Wort-Wort-Zahl, ≥ 12 Zeichen', () => {
    const p = generatePassphrase();
    expect(p.length).toBeGreaterThanOrEqual(12);
    expect(p).toMatch(/^[A-Za-zÀ-ÿ]+-[A-Za-zÀ-ÿ]+-\d{3}$/);
  });

  it('Start- und Experten-Passwort sind verschieden', () => {
    for (let i = 0; i < 20; i++) {
      const { start, expert } = generateTwoPassphrases();
      expect(start).not.toBe(expert);
    }
  });
});
