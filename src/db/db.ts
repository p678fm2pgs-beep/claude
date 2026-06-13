/**
 * HAVEN ATELIER — Persistenz via IndexedDB (Dexie).
 * Autosave + schemaVersion-Migrationen. Alte Projekte laden nach Updates fehlerfrei.
 */
import Dexie, { type Table } from 'dexie';
import { SCHEMA_VERSION, type Project } from '../types';
import type { StoredHash } from '../lib/password';
import { migrateProject } from './migrations';

export interface MetaRecord {
  key: string;
  value: unknown;
}

export interface AuthRecord {
  start: StoredHash;
  expert: StoredHash;
  createdAt: number;
}

class HavenDB extends Dexie {
  projects!: Table<Project, string>;
  meta!: Table<MetaRecord, string>;

  constructor() {
    super('haven-atelier');
    this.version(1).stores({
      projects: 'id, modified, name',
      meta: 'key',
    });
  }
}

export const db = new HavenDB();

// ── Auth ──
export async function getAuth(): Promise<AuthRecord | undefined> {
  const rec = await db.meta.get('auth');
  return rec?.value as AuthRecord | undefined;
}

export async function setAuth(auth: AuthRecord): Promise<void> {
  await db.meta.put({ key: 'auth', value: auth });
}

export async function hasAuth(): Promise<boolean> {
  return (await getAuth()) !== undefined;
}

// ── Sprache ──
export async function getStoredLang(): Promise<'de' | 'en' | undefined> {
  const rec = await db.meta.get('lang');
  return rec?.value as 'de' | 'en' | undefined;
}

export async function setStoredLang(lang: 'de' | 'en'): Promise<void> {
  await db.meta.put({ key: 'lang', value: lang });
}

// ── Preis-Overrides (Expertenmodus) ──
export async function getPriceOverrides(): Promise<Record<string, number>> {
  const rec = await db.meta.get('priceOverrides');
  return (rec?.value as Record<string, number>) ?? {};
}

export async function setPriceOverrides(o: Record<string, number>): Promise<void> {
  await db.meta.put({ key: 'priceOverrides', value: o });
}

// ── Projekte ──
export async function listProjects(): Promise<Project[]> {
  const all = await db.projects.toArray();
  return all.map(migrateProject).sort((a, b) => b.modified - a.modified);
}

export async function getProject(id: string): Promise<Project | undefined> {
  const p = await db.projects.get(id);
  return p ? migrateProject(p) : undefined;
}

export async function saveProject(project: Project): Promise<void> {
  const toSave: Project = { ...project, schemaVersion: SCHEMA_VERSION, modified: Date.now() };
  await db.projects.put(toSave);
}

export async function deleteProject(id: string): Promise<void> {
  await db.projects.delete(id);
}

export async function resetAllData(): Promise<void> {
  await db.delete();
  await db.open();
}
