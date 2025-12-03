/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2596be',
          50: '#f0f9fc',
          100: '#d9f0f7',
          200: '#b8e3f0',
          300: '#87cfe5',
          400: '#4eb4d3',
          500: '#2596be',
          600: '#1e7aa0',
          700: '#1b6182',
          800: '#1c526b',
          900: '#1c445a',
        },
        secondary: {
          DEFAULT: '#765db6',
          50: '#f6f4fc',
          100: '#ede9f9',
          200: '#ddd6f4',
          300: '#c5b7eb',
          400: '#a88fdf',
          500: '#8f6bd0',
          600: '#765db6',
          700: '#674fa3',
          800: '#564287',
          900: '#48386f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
