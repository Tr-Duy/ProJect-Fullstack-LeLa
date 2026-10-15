/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#F97316',
          50: '#FFF1E0',
          100: '#FFE3C7',
          600: '#EA580C',
          700: '#C2410C',
        },
        chrome: '#FFFBF5',
        sun: '#FFC53D',
        teal: {
          DEFAULT: '#12A594',
          50: '#E3F7F4',
        },
        hover: '#FFF3E3',
      },
    },
  },
  plugins: [],
};
