/**
 * HAVEN ATELIER — Zentraler Zustand (Zustand) inkl. Autosave nach IndexedDB.
 */
import { create } from 'zustand';
import type { AppMode, Lang, Project } from '../types';
import {
  getAuth,
  setAuth,
  hasAuth,
  getStoredLang,
  setStoredLang,
  listProjects,
  saveProject,
  deleteProject,
  getProject,
  resetAllData,
  getPriceOverrides,
  setPriceOverrides,
  type AuthRecord,
} from '../db/db';
import { hashPassword, verifyPassword } from '../lib/password';
import { createProject, createDemoProject, createShowcaseProject } from '../lib/factory';
import { migrateProject } from '../db/migrations';

type SaveState = 'idle' | 'saving' | 'saved';

interface AppState {
  ready: boolean;
  hasSetup: boolean;
  unlocked: boolean;
  expertUnlocked: boolean;
  lang: Lang;
  mode: AppMode;
  presenting: boolean;
  projects: Project[];
  project: Project | null;
  saveState: SaveState;
  priceOverrides: Record<string, number>;
  toast: string | null;

  init: () => Promise<void>;
  completeSetup: (startPw: string, expertPw: string) => Promise<void>;
  login: (pw: string) => Promise<boolean>;
  unlockExpert: (pw: string) => Promise<boolean>;
  lockExpert: () => void;
  logout: () => void;
  setLang: (lang: Lang) => Promise<void>;
  setMode: (mode: AppMode) => void;
  setPresenting: (v: boolean) => void;
  refreshProjects: () => Promise<void>;
  newProject: (name: string) => Promise<void>;
  openProject: (id: string) => Promise<void>;
  closeProject: () => void;
  deleteProjectById: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<void>;
  seedDemo: () => Promise<void>;
  seedShowcase: () => Promise<void>;
  importProject: (json: string) => Promise<boolean>;
  updateProject: (mutator: (p: Project) => void) => void;
  setPriceOverride: (key: string, value: number) => Promise<void>;
  resetAll: () => Promise<void>;
  showToast: (msg: string | null) => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export const useStore = create<AppState>((set, get) => ({
  ready: false,
  hasSetup: false,
  unlocked: false,
  expertUnlocked: false,
  lang: 'de',
  mode: 'beratung',
  presenting: false,
  projects: [],
  project: null,
  saveState: 'idle',
  priceOverrides: {},
  toast: null,

  async init() {
    try {
      const [setupDone, lang, overrides] = await Promise.all([
        hasAuth(),
        getStoredLang(),
        getPriceOverrides(),
      ]);
      const projects = await listProjects();
      set({
        ready: true,
        hasSetup: setupDone,
        lang: lang ?? 'de',
        projects,
        priceOverrides: overrides,
      });
    } catch {
      set({ ready: true });
    }
  },

  async completeSetup(startPw, expertPw) {
    const [start, expert] = await Promise.all([hashPassword(startPw), hashPassword(expertPw)]);
    const auth: AuthRecord = { start, expert, createdAt: Date.now() };
    await setAuth(auth);
    set({ hasSetup: true, unlocked: true });
  },

  async login(pw) {
    const auth = await getAuth();
    if (!auth) return false;
    const okStart = await verifyPassword(pw, auth.start);
    if (okStart) {
      set({ unlocked: true });
      await get().refreshProjects();
      return true;
    }
    return false;
  },

  async unlockExpert(pw) {
    const auth = await getAuth();
    if (!auth) return false;
    const okExpert = await verifyPassword(pw, auth.expert);
    if (okExpert) {
      set({ expertUnlocked: true, mode: 'experte' });
      return true;
    }
    return false;
  },

  lockExpert() {
    set({ expertUnlocked: false, mode: 'beratung' });
  },

  logout() {
    set({ unlocked: false, expertUnlocked: false, project: null, mode: 'beratung', presenting: false });
  },

  async setLang(lang) {
    await setStoredLang(lang);
    set({ lang });
  },

  setMode(mode) {
    set({ mode });
  },

  setPresenting(v) {
    set({ presenting: v });
  },

  async refreshProjects() {
    const projects = await listProjects();
    set({ projects });
  },

  async newProject(name) {
    const p = createProject(name || 'Neues Projekt');
    await saveProject(p);
    await get().refreshProjects();
    set({ project: p });
  },

  async openProject(id) {
    const p = await getProject(id);
    if (p) set({ project: p });
  },

  closeProject() {
    set({ project: null, presenting: false });
  },

  async deleteProjectById(id) {
    await deleteProject(id);
    const cur = get().project;
    if (cur?.id === id) set({ project: null });
    await get().refreshProjects();
  },

  async duplicateProject(id) {
    const p = await getProject(id);
    if (!p) return;
    const copy = clone(p);
    copy.id = createProject('x').id;
    copy.name = `${p.name} (Kopie)`;
    copy.created = Date.now();
    copy.modified = Date.now();
    await saveProject(copy);
    await get().refreshProjects();
  },

  async seedDemo() {
    const p = createDemoProject();
    await saveProject(p);
    await get().refreshProjects();
    set({ project: p });
  },

  async seedShowcase() {
    const p = createShowcaseProject();
    await saveProject(p);
    await get().refreshProjects();
    set({ project: p });
  },

  async importProject(json) {
    try {
      const parsed = JSON.parse(json) as Project;
      if (!parsed || typeof parsed !== 'object' || !parsed.rooms) return false;
      const migrated = migrateProject(parsed);
      migrated.id = createProject('x').id; // neue ID, um Kollisionen zu vermeiden
      migrated.modified = Date.now();
      await saveProject(migrated);
      await get().refreshProjects();
      set({ project: migrated });
      return true;
    } catch {
      return false;
    }
  },

  updateProject(mutator) {
    const cur = get().project;
    if (!cur) return;
    const next = clone(cur);
    mutator(next);
    next.modified = Date.now();
    set({ project: next, saveState: 'saving' });
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      try {
        await saveProject(next);
        // Projektliste leichtgewichtig aktualisieren.
        const projects = get().projects.map((p) => (p.id === next.id ? next : p));
        set({ saveState: 'saved', projects });
      } catch {
        set({ saveState: 'idle', toast: 'toast.error' });
      }
    }, 400);
  },

  async setPriceOverride(key, value) {
    const next = { ...get().priceOverrides, [key]: value };
    await setPriceOverrides(next);
    set({ priceOverrides: next });
  },

  async resetAll() {
    await resetAllData();
    set({
      hasSetup: false,
      unlocked: false,
      expertUnlocked: false,
      project: null,
      projects: [],
      priceOverrides: {},
    });
  },

  showToast(msg) {
    set({ toast: msg });
  },
}));
