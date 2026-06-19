import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';
import { useStore } from '../store/useStore';
import { db, listProjects, saveProject } from '../db/db';
import { createDemoProject } from '../lib/factory';
import { computeProjectCost } from '../lib/projectCost';

async function freshDb() {
  await db.delete();
  await db.open();
  // Store-Singleton in den Ausgangszustand zurücksetzen.
  useStore.setState({
    ready: false,
    hasSetup: false,
    unlocked: false,
    expertUnlocked: false,
    project: null,
    projects: [],
    mode: 'beratung',
    presenting: false,
  });
}

describe('Integration — App-Flow (jsdom)', () => {
  beforeEach(async () => {
    cleanup();
    await freshDb();
  });

  it('Erst-Setup zeigt beide Passwörter genau einmal und schaltet danach frei', async () => {
    const user = userEvent.setup();
    render(<App />);

    const continueBtn = await screen.findByTestId('setup-continue', {}, { timeout: 5000 });
    // Beide Passwörter sichtbar
    expect(screen.getByTestId('pw-start').textContent).toBeTruthy();
    expect(screen.getByTestId('pw-expert').textContent).toBeTruthy();
    expect(screen.getByTestId('pw-start').textContent).not.toBe(screen.getByTestId('pw-expert').textContent);

    // Ohne Bestätigung ist „Weiter" deaktiviert
    expect(continueBtn).toBeDisabled();
    await user.click(screen.getByTestId('confirm-pw'));
    expect(continueBtn).toBeEnabled();
    await user.click(continueBtn);

    // Danach: Projektliste (kein Klartext-Passwort mehr im DOM)
    await screen.findByTestId('seed-demo', {}, { timeout: 5000 });
    expect(screen.queryByTestId('pw-start')).toBeNull();
  });

  it('Demo laden und Kosten prüfen: Summe > 0, Reserve sichtbar, Brutto > Netto', async () => {
    const user = userEvent.setup();
    render(<App />);

    const continueBtn = await screen.findByTestId('setup-continue', {}, { timeout: 5000 });
    await user.click(screen.getByTestId('confirm-pw'));
    await user.click(continueBtn);

    await user.click(await screen.findByTestId('seed-demo', {}, { timeout: 5000 }));

    // In die Kosten navigieren
    await user.click(await screen.findByTestId('nav-costs', {}, { timeout: 5000 }));
    const summary = await screen.findByTestId('cost-summary', {}, { timeout: 5000 });

    expect(within(summary).getByTestId('reserve-line')).toBeInTheDocument();
    expect(within(summary).getByTestId('net-total')).toBeInTheDocument();
    expect(within(summary).getByTestId('gross-total')).toBeInTheDocument();

    // Numerische Gegenprobe über die Engine
    const demo = createDemoProject();
    const cost = computeProjectCost(demo);
    expect(cost.gross.min).toBeGreaterThan(cost.net.min);
    expect(cost.net.min).toBeGreaterThan(0);
    expect(cost.reserve.totalMin).toBeGreaterThan(0);
  });

  it('Sprachumschaltung DE → EN ändert die Navigation', async () => {
    const user = userEvent.setup();
    render(<App />);
    const continueBtn = await screen.findByTestId('setup-continue', {}, { timeout: 5000 });
    await user.click(screen.getByTestId('confirm-pw'));
    await user.click(continueBtn);
    await screen.findByTestId('seed-demo', {}, { timeout: 5000 });

    await user.click(screen.getByTestId('lang-en'));
    // „Projekte" → „Projects"
    await waitFor(() => expect(screen.getByText('Projects')).toBeInTheDocument());
  });
});

describe('Integration — Erweiterung 4: Showcase + realistische 2D-Ansicht', () => {
  beforeEach(async () => {
    cleanup();
    await freshDb();
  });

  it('Showcase laden, Raum öffnen, auf „Realistische Ansicht" umschalten', async () => {
    const user = userEvent.setup();
    render(<App />);
    const continueBtn = await screen.findByTestId('setup-continue', {}, { timeout: 5000 });
    await user.click(screen.getByTestId('confirm-pw'));
    await user.click(continueBtn);

    await user.click(await screen.findByTestId('seed-showcase', {}, { timeout: 5000 }));
    // Raum-Modul (Standardansicht beim Öffnen)
    await user.click(await screen.findByTestId('nav-rooms', {}, { timeout: 5000 }));
    const editor = await screen.findByTestId('room-editor', {}, { timeout: 5000 });

    // Standardmäßig technischer Plan (im Editor)
    expect(within(editor).getByTestId('floorplan-svg')).toBeInTheDocument();
    // Auf realistische Ansicht umschalten
    await user.click(within(editor).getByTestId('plan-realistisch'));
    expect(within(editor).getByTestId('realistic-plan')).toBeInTheDocument();
    // Zurück auf technisch
    await user.click(within(editor).getByTestId('plan-technisch'));
    expect(within(editor).getByTestId('floorplan-svg')).toBeInTheDocument();
  });
});

describe('Integration — Persistenz & Migration (DB-Ebene)', () => {
  beforeEach(async () => {
    await freshDb();
  });

  it('gespeichertes Projekt überlebt einen Reload (erneutes Laden aus IndexedDB)', async () => {
    const demo = createDemoProject();
    await saveProject(demo);
    const loaded = await listProjects();
    expect(loaded.length).toBe(1);
    expect(loaded[0].rooms.length).toBe(3);
    expect(loaded[0].rooms[0].variants[0].trades).toBeDefined();
  });
});
