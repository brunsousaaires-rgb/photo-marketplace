import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f5f6f2',
        ink: {
          950: '#08090a',
          900: '#111413',
          800: '#1b1f1e',
          700: '#2a302e',
        },
        accent: {
          300: '#e4ff8c',
          400: '#d4ff4d',
          500: '#c8ff00',
          600: '#9fd400',
        },
        accent2: {
          400: '#5ff2ff',
          500: '#00e5ff',
          600: '#00b0c2',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Impact', 'ui-sans-serif', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(8,9,10,0.04), 0 8px 24px -8px rgba(8,9,10,0.12)',
        'card-hover': '0 4px 8px rgba(8,9,10,0.06), 0 20px 40px -12px rgba(8,9,10,0.22)',
        glow: '0 0 0 1px rgba(200,255,0,0.4), 0 8px 30px -6px rgba(200,255,0,0.35)',
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};

export default config;
