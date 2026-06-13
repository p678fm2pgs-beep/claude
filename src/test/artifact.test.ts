import { describe, it, expect } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createDemoProject } from '../lib/factory';
import { computeProjectCost } from '../lib/projectCost';
import { translate } from '../i18n';

/**
 * Erzeugt ein nachvollziehbares Kalkulations-Artefakt der Demo „Musterwohnung Düsseldorf"
 * unter /qa/artifacts — belegt die vollständige Kosten-Engine maschinell.
 */
describe('QA-Artefakt — Demo-Kalkulation', () => {
  it('schreibt qa/artifacts/demo-kalkulation.json', () => {
    const demo = createDemoProject();
    const cost = computeProjectCost(demo);

    const artifact = {
      projekt: demo.name,
      kunde: demo.customer,
      preisstand: demo.priceListDate,
      raeume: cost.rooms.map((r) => ({
        raum: r.roomName,
        positionen: r.lines.length,
        zwischensumme: r.subtotal,
        zwischensummeEK: r.ekSubtotal,
      })),
      honorar: { min: cost.fee.totalMin, max: cost.fee.totalMax },
      reserve: { min: cost.reserve.totalMin, max: cost.reserve.totalMax },
      netto: cost.net,
      mwst: cost.vat,
      brutto: cost.gross,
      ekGesamt: cost.ekTotal,
      gewerke: cost.byGewerk,
      disclaimer: translate('de', 'costs.disclaimer'),
    };

    const dir = resolve(process.cwd(), 'qa/artifacts');
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, 'demo-kalkulation.json'), JSON.stringify(artifact, null, 2), 'utf-8');

    expect(cost.gross.min).toBeGreaterThan(cost.net.min);
    expect(cost.rooms.length).toBe(3);
  });
});
