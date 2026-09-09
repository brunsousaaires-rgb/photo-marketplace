import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './data/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        'bg-elevated': 'rgb(var(--bg-elevated) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-muted': 'rgb(var(--ink-muted) / <alpha-value>)',
        'ink-soft': 'rgb(var(--ink-soft) / <alpha-value>)',
        gold: {
          DEFAULT: 'rgb(var(--gold) / <alpha-value>)',
          light: 'rgb(var(--gold-light) / <alpha-value>)',
          dark: 'rgb(var(--gold-dark) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '0.28em',
      },
      transitionTimingFunction: {
        cinematic: 'cubic-bezier(0.16, 1, 0.3, 1)',
        smooth: 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, rgb(var(--gold-dark)) 0%, rgb(var(--gold-light)) 50%, rgb(var(--gold-dark)) 100%)',
        'radial-fade': 'radial-gradient(circle at center, rgba(255,255,255,0.06) 0%, transparent 70%)',
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
        shimmer: 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
