/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: 'rgb(var(--color-night-rgb) / <alpha-value>)',
        poke: 'rgb(var(--color-accent-rgb) / <alpha-value>)',
        pokeSoft: 'rgb(var(--color-accent-soft-rgb) / <alpha-value>)',
        slateSoft: '#6b7280',
      },
      boxShadow: {
        glow: 'var(--shadow-glow)',
      },
    },
  },
  plugins: [],
};
