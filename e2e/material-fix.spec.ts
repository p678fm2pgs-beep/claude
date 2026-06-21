import { test, expect } from '@playwright/test';
import { attachConsoleGuard, completeSetup, expectNoConsoleErrors } from './helpers';
import fs from 'node:fs';

/**
 * BEWEIS (browsergebunden): Die gewählte Bodenwahl schlägt in 2D „Realistisch" UND 3D durch.
 * Wählt nacheinander einen sehr dunklen und einen sehr hellen Boden und prüft, dass sich die
 * dargestellte Fläche sichtbar unterscheidet (Screenshots in /qa/material-fix).
 */
const DIR = 'qa/material-fix';

async function selectFloor(page: import('@playwright/test').Page, materialId: string) {
  await page.getByTestId('nav-materials').click();
  await page.getByTestId('matcat-Böden').click();
  await page.getByTestId(`add-material-${materialId}`).click();
}

test('Bodenwahl schlägt in 2D & 3D durch (dunkel ≠ hell)', async ({ page }) => {
  const errors = attachConsoleGuard(page);
  fs.mkdirSync(DIR, { recursive: true });
  await completeSetup(page);
  await page.getByTestId('seed-showcase').click();

  // ── dunkler Boden ──
  await selectFloor(page, 'naturstein-schiefer'); // sehr dunkel
  await page.getByTestId('nav-rooms').click();
  const editor = page.getByTestId('room-editor');
  await editor.getByTestId('plan-realistisch').click();
  await page.waitForTimeout(400);
  const dark2d = await editor.getByTestId('realistic-plan').screenshot({ path: `${DIR}/floor-dark-2d.png` });
  await editor.getByTestId('plan-3d').click();
  await expect(editor.locator('[data-testid="room-3d"] canvas')).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(1500);
  const dark3d = await editor.locator('[data-testid="room-3d"] canvas').screenshot({ path: `${DIR}/floor-dark-3d.png` });

  // ── heller Boden ──
  await selectFloor(page, 'naturstein-marmor'); // sehr hell
  await page.getByTestId('nav-rooms').click();
  await editor.getByTestId('plan-realistisch').click();
  await page.waitForTimeout(400);
  const light2d = await editor.getByTestId('realistic-plan').screenshot({ path: `${DIR}/floor-light-2d.png` });
  await editor.getByTestId('plan-3d').click();
  await expect(editor.locator('[data-testid="room-3d"] canvas')).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(1500);
  const light3d = await editor.locator('[data-testid="room-3d"] canvas').screenshot({ path: `${DIR}/floor-light-3d.png` });

  // Die Darstellungen müssen sich unterscheiden → Auswahl schlägt durch.
  expect(Buffer.compare(dark2d, light2d)).not.toBe(0);
  expect(Buffer.compare(dark3d, light3d)).not.toBe(0);

  await expectNoConsoleErrors(errors);
});
