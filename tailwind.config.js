/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0B',
        surface: '#131312',
        'surface-2': '#1B1B19',
        text: '#F5F2EA',
        muted: '#9A958A',
        gold: '#C9A84C',
        'gold-soft': 'rgba(201,168,76,0.16)',
        line: 'rgba(201,168,76,0.16)',
        board: '#F6F4EF',
        'board-ink': '#1A1814',
        danger: '#C8553D',
        ok: '#6B8F71',
        warn: '#C9A84C',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        eyebrow: '0.28em',
      },
      borderRadius: {
        DEFAULT: '2px',
        sm: '2px',
        md: '4px',
      },
      transitionDuration: {
        250: '250ms',
      },
    },
  },
  plugins: [],
};
