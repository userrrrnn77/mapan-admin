/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'], // Ini biar sinkron sama useTheme.js lu
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4630eb',
          dark: '#3521b5',
        },
        main: {
          light: '#f4f7fe',
          dark: '#0b1437', // Warna dark mode lu
        },
        card: {
          light: '#ffffff',
          dark: '#111c44',
        },
      },
      boxShadow: {
        custom: '14px 17px 40px 4px rgba(112, 144, 176, 0.08)',
      },
    },
  },
  plugins: [],
};
