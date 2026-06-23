/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Markenpalette – alle Text/BG-Kombinationen geprüft auf WCAG 2.1 AA (≥ 4,5:1).
        ink: '#15191c', // Fließtext auf hell (Kontrast ~15:1 auf paper)
        anthracite: {
          DEFAULT: '#22282c', // Primär: Kopf/Fuß, Buttons (Weiß darauf ~13:1)
          700: '#2d353a',
          600: '#3a444a',
        },
        bronze: {
          DEFAULT: '#7c5320', // Akzent für Links/Icons auf hell (~5,4:1 auf weiß)
          400: '#b88a4a', // dekorativer Akzent auf dunklem Grund
        },
        paper: '#fbfaf8', // Seitenhintergrund
        surface: '#ffffff',
        line: '#e4e1dc', // Trennlinien
        muted: '#55606a', // Sekundärtext auf hell (~7:1)
      },
      fontFamily: {
        // Selbst-gehostete/Systemschriften – keine Google-Fonts-Requests (DSGVO).
        serif: ['Georgia', '"Times New Roman"', 'serif'],
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      maxWidth: {
        prose: '72ch',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
