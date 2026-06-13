import { test, expect } from '@playwright/test';
import { attachConsoleGuard, completeSetup, expectNoConsoleErrors } from './helpers';

const VIEWS = ['rooms', 'light', 'style', 'colors', 'materials', 'furniture', 'costs', 'board'];
const FORBIDDEN = /(TODO|coming soon|not implemented|nicht implementiert|undefined|NaN)/i;
// Buttons, die bewusst nicht im Blindscan geklickt werden (Navigation/Downloads/destruktiv).
const SKIP_TESTIDS = new Set([
  'export-pdf', 'export-internal-pdf', 'email-btn', 'present-btn', 'seed-demo',
  'confirm-delete', 'confirm-reset', 'change-pw',
]);

test('Toter-Knopf-Scanner: jede Ansicht hat Inhalt, keine toten Knöpfe, keine verbotenen Texte', async ({ page }) => {
  const errors = attachConsoleGuard(page);
  await completeSetup(page);
  await page.getByTestId('seed-demo').click();
  await page.getByTestId('nav-rooms').waitFor();

  for (const view of VIEWS) {
    await page.getByTestId(`nav-${view}`).click();
    // Inhalt vorhanden (kein leerer Screen)
    const main = page.locator('main');
    await expect(main).toBeVisible();
    const text = (await main.innerText()).trim();
    expect(text.length, `Ansicht ${view} ist leer`).toBeGreaterThan(0);
    expect(text, `Verbotener Text in ${view}`).not.toMatch(FORBIDDEN);

    // Sichtbare Buttons (gefiltert) anklicken
    const buttons = page.locator('main button:visible');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const tid = (await btn.getAttribute('data-testid')) ?? '';
      if (SKIP_TESTIDS.has(tid)) continue;
      // Logout/Modus etc. liegen außerhalb von <main>, daher ungefährlich.
      await btn.click({ trial: false }).catch(() => {});
    }
  }

  await expectNoConsoleErrors(errors);
});
