/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'app-bg': '#111111',
        'app-surface': '#1a1a1a',
        'app-card': '#1e1e1e',
        'app-border': '#2a2a2a',
        'app-accent': '#22c55e',
        'app-accent-dark': '#16a34a',
        'app-accent-dim': '#1a3a25',
        'app-muted': '#a1a1aa',
        'app-danger': '#ef4444',
        'app-warning': '#f59e0b',
        'app-info': '#3b82f6',
        'app-lime': '#c9f158',
      },
    },
  },
  plugins: [],
};
