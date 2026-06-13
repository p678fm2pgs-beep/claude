import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { vi } from 'vitest';

/**
 * jsdom implementiert kein Canvas. Für Integrationstests (Material-Texturen, PDF-Vorschau)
 * stellen wir einen schlanken 2D-Kontext-Stub bereit, damit Komponenten rendern.
 */
const ctxStub = new Proxy(
  {
    canvas: { width: 0, height: 0 },
    fillRect: () => {},
    strokeRect: () => {},
    clearRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    bezierCurveTo: () => {},
    stroke: () => {},
    fill: () => {},
    ellipse: () => {},
    arc: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} }),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
  },
  { get: (target: Record<string, unknown>, prop: string) => (prop in target ? target[prop] : () => {}) },
);

// @ts-expect-error - Test-Stub
HTMLCanvasElement.prototype.getContext = vi.fn(() => ctxStub);
HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');

// matchMedia-Stub (für evtl. responsive Hooks)
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}
