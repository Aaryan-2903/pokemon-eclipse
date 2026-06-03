/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: '#0b1320',
        poke: '#f32424',
        pokeSoft: '#f75c5c',
        slateSoft: '#6b7280',
      },
      boxShadow: {
        glow: '0 0 60px rgba(243, 36, 36, 0.2)',
      },
    },
  },
  plugins: [],
};
