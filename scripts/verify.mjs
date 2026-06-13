#!/usr/bin/env node
/**
 * HAVEN ATELIER — Ein Prüfbefehl.
 * Führt nacheinander aus: typecheck → lint → Unit-Tests → Production-Build → E2E.
 * Bricht beim ersten Fehler ab und gibt einen klaren Report.
 *
 * Flags:
 *   --no-e2e   E2E überspringen (z. B. wenn kein Browser installiert ist)
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

let skipE2e = process.argv.includes('--no-e2e') || process.env.HAVEN_SKIP_E2E === '1';

// Preflight: Ist ein Playwright-Browser installiert? Falls nicht (z. B. wegen
// gesperrtem Browser-Download im Sandbox-Netz), E2E sauber überspringen statt rot.
let e2eSkipReason = 'per Flag übersprungen';
if (!skipE2e) {
  let browserReady = false;
  try {
    const { chromium } = await import('@playwright/test');
    const exe = chromium.executablePath();
    browserReady = !!exe && existsSync(exe);
  } catch {
    browserReady = false;
  }
  if (!browserReady) {
    skipE2e = true;
    e2eSkipReason = 'kein Playwright-Browser installiert (npx playwright install chromium)';
  }
}

const steps = [
  { name: 'TypeScript (typecheck)', cmd: 'npm', args: ['run', 'typecheck'] },
  { name: 'ESLint (lint)', cmd: 'npm', args: ['run', 'lint'] },
  { name: 'Vitest (Unit + Integration)', cmd: 'npm', args: ['run', 'test'] },
  { name: 'Production-Build', cmd: 'npm', args: ['run', 'build'] },
];

if (!skipE2e) {
  steps.push({ name: 'Playwright (E2E)', cmd: 'npm', args: ['run', 'e2e'] });
}

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const GOLD = '\x1b[33m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

console.log(`${GOLD}━━━ HAVEN ATELIER · npm run verify ━━━${RESET}\n`);

const results = [];
const t0 = Date.now();

for (const step of steps) {
  const start = Date.now();
  console.log(`${GOLD}▶ ${step.name}${RESET}`);
  const res = spawnSync(step.cmd, step.args, { stdio: 'inherit', shell: false });
  const secs = ((Date.now() - start) / 1000).toFixed(1);
  if (res.status !== 0) {
    results.push({ name: step.name, ok: false, secs });
    console.log(`\n${RED}✖ FEHLGESCHLAGEN: ${step.name} (${secs}s)${RESET}`);
    printSummary(results);
    process.exit(1);
  }
  results.push({ name: step.name, ok: true, secs });
  console.log(`${GREEN}✔ ${step.name} (${secs}s)${RESET}\n`);
}

printSummary(results);
const total = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`\n${GREEN}━━━ ALLES GRÜN · Gesamtdauer ${total}s ━━━${RESET}`);
if (skipE2e)
  console.log(
    `${GOLD}⚠ Playwright-E2E ${e2eSkipReason}.${RESET}\n${DIM}  Die E2E-Specs liegen in /e2e und laufen mit "npm run e2e:install && npm run e2e".${RESET}`,
  );

function printSummary(rows) {
  console.log(`\n${GOLD}Zusammenfassung:${RESET}`);
  for (const r of rows) {
    const mark = r.ok ? `${GREEN}✔${RESET}` : `${RED}✖${RESET}`;
    console.log(`  ${mark} ${r.name} ${DIM}(${r.secs}s)${RESET}`);
  }
}
