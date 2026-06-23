import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Prototyp-Konfiguration. Kein externes Tracking, keine Laufzeit-Requests an Dritte.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    sourcemap: false,
  },
});
