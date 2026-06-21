import { test, expect } from '@playwright/test';
import { attachConsoleGuard, completeSetup, expectNoConsoleErrors } from './helpers';
import fs from 'node:fs';

/**
 * Erweiterung 5 — 3D-Render-Smoke (browsergebunden).
 * Prüft: WebGL initialisiert ohne console.error, das 3D-Bild ist nicht-leer/nicht-trivial,
 * und legt einen „nachher"-Screenshot in /qa/screenshots/erweiterung5 ab.
 */
test('3D-Archviz rendert beleuchtet (nicht leer/einfarbig) + Screenshot', async ({ page }) => {
  const errors = attachConsoleGuard(page);
  await completeSetup(page);
  await page.getByTestId('seed-showcase').click();
  await page.getByTestId('nav-rooms').click();

  const editor = page.getByTestId('room-editor');
  await editor.waitFor();
  await editor.getByTestId('plan-3d').click();

  const canvas = editor.locator('[data-testid="room-3d"] canvas');
  await expect(canvas).toBeVisible({ timeout: 15000 });
  // Render-Frames abwarten
  await page.waitForTimeout(1500);

  const dir = 'qa/screenshots/erweiterung5';
  fs.mkdirSync(dir, { recursive: true });
  const png = await canvas.screenshot({ path: `${dir}/showcase-3d.png` });

  // Eine beleuchtete, texturierte Szene komprimiert deutlich größer als ein einfarbiges Bild.
  expect(png.byteLength).toBeGreaterThan(8000);

  await expectNoConsoleErrors(errors);
});
