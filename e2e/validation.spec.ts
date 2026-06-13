import { test, expect } from '@playwright/test';
import { attachConsoleGuard, completeSetup, fillNumber, expectNoConsoleErrors } from './helpers';

test('Validierung: unmögliche Eingaben werden inline abgefangen, kein Crash, kein NaN', async ({ page }) => {
  const errors = attachConsoleGuard(page);
  await completeSetup(page);

  await page.getByTestId('new-project-name').fill('Validierung');
  await page.getByTestId('create-project').click();
  await page.getByTestId('new-room-name').fill('Test');
  await page.getByTestId('add-room').click();
  await page.getByTestId('room-editor').waitFor();

  // Rechteck 4,0 × 3,5 m setzen
  await fillNumber(page, 'room-width', '4,0');
  await fillNumber(page, 'room-depth', '3,5');

  // Raumhöhe 9 m → Fehler, Wert wird nicht übernommen
  await fillNumber(page, 'room-height', '9');
  await expect(page.getByRole('alert').filter({ hasText: /2(,|\.)00.*6(,|\.)00|between 2.*6/ })).toBeVisible();

  // Text im Zahlenfeld → kein NaN, kein Crash
  await fillNumber(page, 'room-width', 'abc');
  await expect(page.getByTestId('area-floor')).not.toContainText('NaN');

  // Gültige Höhe wiederherstellen, dann Fenster breiter als Wand
  await fillNumber(page, 'room-height', '2,7');
  await page.getByTestId('add-window').click();
  await fillNumber(page, 'opening-width', '6,0'); // Wand ist nur 4,0 m
  await expect(page.getByTestId('opening-error').first()).toBeVisible();

  // App weiterhin bedienbar (kein Crash): zu Materialien wechseln
  await page.getByTestId('nav-materials').click();
  await expect(page.getByTestId('material-grid')).toBeVisible();

  await expectNoConsoleErrors(errors);
});
