import { test, expect } from '@playwright/test';
import { attachConsoleGuard, completeSetup, fillNumber, expectNoConsoleErrors } from './helpers';
import fs from 'node:fs';

/**
 * KUNDEN-REISE (komplett) — als geführte Beratung, in DE und EN.
 * App öffnen → Setup → Projekt → Raum zeichnen → Licht → Stil → Farben →
 * Materialien → Möbel → Kosten → Board → PDF → Projekt-Export → Reload.
 */
for (const lang of ['de', 'en'] as const) {
  test(`Kunden-Reise komplett (${lang})`, async ({ page }, testInfo) => {
    const errors = attachConsoleGuard(page);
    await completeSetup(page);

    if (lang === 'en') await page.getByTestId('lang-en').click();

    // Projekt anlegen
    await page.getByTestId('new-project-name').fill('Atelier-Test');
    await page.getByTestId('create-project').click();
    await page.getByTestId('nav-rooms').waitFor();

    // Raum „Wohnzimmer" anlegen
    await page.getByTestId('new-room-name').fill('Wohnzimmer');
    await page.getByTestId('new-room-type').selectOption('wohnzimmer');
    await page.getByTestId('add-room').click();
    await page.getByTestId('room-editor').waitFor();

    // Maße 5,2 × 4,4 m, Höhe 2,7 m
    await fillNumber(page, 'room-width', '5,2');
    await fillNumber(page, 'room-depth', '4,4');
    await fillNumber(page, 'room-height', '2,7');
    await expect(page.getByTestId('area-floor')).toContainText('22');

    // 1 Fenster + 1 Tür
    await page.getByTestId('add-window').click();
    await page.getByTestId('add-door').click();
    await expect(page.getByTestId('openings-list').getByTestId('opening-row')).toHaveCount(2);

    // Licht
    await page.getByTestId('nav-light').click();
    await page.getByTestId('orient-S').click();
    await page.getByTestId('daylight-viel').click();

    // Stil-Preset
    await page.getByTestId('nav-style').click();
    await page.getByTestId('apply-quiet-luxury').click();

    // Farben: Familie „Weiß" → Ton → Wand-Rolle → Empfehlung
    await page.getByTestId('nav-colors').click();
    await page.getByTestId('family-weiss').click();
    await page.getByTestId('tone-weiss-4').click();
    await page.getByTestId('assign-wand').click();
    await page.getByTestId('apply-ceiling').click();

    // Materialien: 2 wählen
    await page.getByTestId('nav-materials').click();
    await page.getByTestId('add-material-parkett-eiche-landhaus').click();
    await page.getByTestId('add-material-wandfarbe-matt').click();
    await expect(page.getByTestId('chosen-materials').locator('> div')).toHaveCount(2);

    // Möbel: 3 hinzufügen
    await page.getByTestId('nav-furniture').click();
    await page.getByTestId('add-furniture-sofa').click();
    await page.getByTestId('add-furniture-couchtisch').click();
    await page.getByTestId('add-furniture-pendelleuchte').click();
    await expect(page.getByTestId('furniture-list').locator('> div')).toHaveCount(3);

    // Kosten: Summe > 0, Reserve sichtbar, Brutto > Netto
    await page.getByTestId('nav-costs').click();
    await page.getByTestId('cost-summary').waitFor();
    await expect(page.getByTestId('reserve-line')).toBeVisible();
    const net = await page.getByTestId('net-total').textContent();
    const gross = await page.getByTestId('gross-total').textContent();
    const num = (s: string | null) => Number((s ?? '').replace(/[^0-9]/g, ''));
    expect(num(net)).toBeGreaterThan(0);
    expect(num(gross)).toBeGreaterThan(num(net));

    // Board ansehen
    await page.getByTestId('nav-board').click();
    await page.getByTestId('board-view').first().waitFor();

    // PDF-Export (Download abfangen)
    const dl = page.waitForEvent('download');
    await page.getByTestId('export-pdf').click();
    const download = await dl;
    const dir = testInfo.outputDir;
    const pdfPath = `${dir}/moodboard-${lang}.pdf`;
    await download.saveAs(pdfPath);
    expect(fs.statSync(pdfPath).size).toBeGreaterThan(100 * 1024);

    // Projekt-Export (.haven)
    await page.getByTestId('nav-rooms').click();
    // zurück zur Projektliste über Sidebar
    await page.getByText('Atelier-Test').first().waitFor();

    await expectNoConsoleErrors(errors);
  });
}
