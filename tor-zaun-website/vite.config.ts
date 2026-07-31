import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Prototyp-Konfiguration. Kein externes Tracking, keine Laufzeit-Requests an Dritte.
// viteSingleFile bündelt JS + CSS in eine einzige index.html (per Doppelklick öffenbar).
// base './' + HashRouter -> funktioniert auch ohne Webserver (file://).
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: {
    target: 'es2020',
    sourcemap: false,
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
  },
});
