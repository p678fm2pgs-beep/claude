import { test, expect } from '@playwright/test';
import { attachConsoleGuard, completeSetup, expectNoConsoleErrors } from './helpers';

test('Persistenz: Änderung überlebt Reload mitten im Editieren (Autosave)', async ({ page }) => {
  const errors = attachConsoleGuard(page);
  const { start } = await completeSetup(page);

  await page.getByTestId('new-project-name').fill('Persistenz-Projekt');
  await page.getByTestId('create-project').click();
  await page.getByTestId('new-room-name').fill('Bibliothek');
  await page.getByTestId('add-room').click();
  await page.getByTestId('room-editor').waitFor();

  // Auf Autosave warten
  await expect(page.getByTestId('save-state')).toContainText(/Gespeichert|Saved/);

  // Reload mitten im Editieren → Gate erscheint (hasSetup=true), Daten bleiben in IndexedDB
  await page.reload();
  await page.getByTestId('gate-password').fill(start);
  await page.getByTestId('gate-enter').click();

  // Projekt ist weiterhin vorhanden
  await expect(page.getByText('Persistenz-Projekt')).toBeVisible();
  // Und enthält den Raum
  await page.getByText('Persistenz-Projekt').click();
  await expect(page.getByTestId('room-selector')).toContainText('Bibliothek');

  await expectNoConsoleErrors(errors);
});

test('Login & Rollenwechsel: Start-Passwort öffnet App, Experten-Passwort schaltet Expertenmodus', async ({ page }) => {
  const errors = attachConsoleGuard(page);
  const { start, expert } = await completeSetup(page);

  // Abmelden → Gate
  await page.getByText(/Abmelden|Sign out/).click();
  await page.getByTestId('gate-password').fill(start);
  await page.getByTestId('gate-enter').click();
  await page.getByTestId('seed-demo').waitFor();

  // Expertenmodus verlangt Experten-Passwort
  await page.getByTestId('mode-experte').click();
  await page.getByTestId('expert-password').fill(expert);
  await page.getByTestId('expert-unlock').click();
  await expect(page.getByTestId('mode-experte')).toHaveClass(/tab-active/);

  await expectNoConsoleErrors(errors);
});
