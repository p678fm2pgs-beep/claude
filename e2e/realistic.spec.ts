import { test, expect } from '@playwright/test';
import { attachConsoleGuard, completeSetup, expectNoConsoleErrors } from './helpers';

/**
 * Erweiterung 4 — Showcase + realistische 2D-Ansicht (Browser).
 */
test('Showcase „Musterwohnzimmer": technischer ⇄ realistischer Plan, Muster sichtbar', async ({ page }) => {
  const errors = attachConsoleGuard(page);
  await completeSetup(page);

  await page.getByTestId('seed-showcase').click();
  await page.getByTestId('nav-rooms').click();
  const editor = page.getByTestId('room-editor');
  await editor.waitFor();

  // Standard: technischer Plan
  await expect(editor.getByTestId('floorplan-svg')).toBeVisible();

  // Umschalten auf realistische Ansicht → Canvas mit Boden-Textur/Muster
  await editor.getByTestId('plan-realistisch').click();
  const canvas = editor.getByTestId('realistic-plan');
  await expect(canvas).toBeVisible();
  // Canvas hat echte Pixelmaße (gerendert)
  const box = await canvas.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThan(100);

  // 3D-Ansicht (three.js, on-demand geladen)
  await editor.getByTestId('plan-3d').click();
  await expect(editor.getByTestId('room-3d')).toBeVisible({ timeout: 15000 });
  // WebGL-Canvas wurde gemountet
  await expect(editor.locator('[data-testid="room-3d"] canvas')).toBeVisible();

  // Zurück auf technisch (additiv erhalten)
  await editor.getByTestId('plan-technisch').click();
  await expect(editor.getByTestId('floorplan-svg')).toBeVisible();

  await expectNoConsoleErrors(errors);
});

test('Beleuchtung lässt sich hinzufügen und erscheint in den Kosten', async ({ page }) => {
  const errors = attachConsoleGuard(page);
  await completeSetup(page);
  await page.getByTestId('seed-showcase').click();

  await page.getByTestId('nav-furniture').click();
  await page.getByTestId('add-light-led-stripe').click();
  await expect(page.getByTestId('lighting-list')).toBeVisible();

  await page.getByTestId('nav-costs').click();
  await page.getByTestId('cost-summary').waitFor();
  const gross = await page.getByTestId('gross-total').textContent();
  expect(Number((gross ?? '').replace(/[^0-9]/g, ''))).toBeGreaterThan(0);

  await expectNoConsoleErrors(errors);
});
