import { test, expect } from '@playwright/test';
import { attachConsoleGuard, completeSetup, expectNoConsoleErrors } from './helpers';

/** Nach dem Laden NULL externe Requests zur Laufzeit (nur eigene Assets). */
test('Offline-Tauglichkeit: keine Fremd-Requests zur Laufzeit', async ({ page, baseURL }) => {
  const errors = attachConsoleGuard(page);
  const external: string[] = [];
  const allowedHost = new URL(baseURL ?? 'http://localhost:4173').host;

  page.on('request', (req) => {
    const url = req.url();
    if (url.startsWith('data:') || url.startsWith('blob:')) return;
    const host = new URL(url).host;
    if (host !== allowedHost) external.push(url);
  });

  await completeSetup(page);
  await page.getByTestId('seed-demo').click();
  for (const v of ['rooms', 'colors', 'materials', 'costs', 'board']) {
    await page.getByTestId(`nav-${v}`).click();
  }

  expect(external, `Fremd-Requests: ${external.join(', ')}`).toHaveLength(0);
  await expectNoConsoleErrors(errors);
});
