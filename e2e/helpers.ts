import { type Page, expect } from '@playwright/test';

/** Sammelt console.error — der Konsolen-Wächter lässt Tests bei jedem Fehler scheitern. */
export function attachConsoleGuard(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(String(err)));
  return errors;
}

/** Durchläuft das Erst-Setup und liefert die angezeigten Passwörter zurück. */
export async function completeSetup(page: Page): Promise<{ start: string; expert: string }> {
  await page.goto('/');
  await page.getByTestId('setup-continue').waitFor({ state: 'visible' });
  const start = (await page.getByTestId('pw-start').textContent())?.trim() ?? '';
  const expert = (await page.getByTestId('pw-expert').textContent())?.trim() ?? '';
  await page.getByTestId('confirm-pw').check();
  await page.getByTestId('setup-continue').click();
  await page.getByTestId('seed-demo').waitFor({ state: 'visible' });
  return { start, expert };
}

/** Füllt ein numerisches Feld (onBlur-Commit) und löst Blur aus. */
export async function fillNumber(page: Page, testid: string, value: string): Promise<void> {
  const input = page.getByTestId(testid);
  await input.fill(value);
  await input.blur();
}

export async function expectNoConsoleErrors(errors: string[]): Promise<void> {
  expect(errors, `Konsolenfehler: ${errors.join(' | ')}`).toHaveLength(0);
}
