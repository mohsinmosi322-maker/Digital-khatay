/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#185FA5',
          50: '#E8F1F8',
          100: '#D1E3F1',
          200: '#A3C7E3',
          300: '#75ABD5',
          400: '#478FC7',
          500: '#185FA5',
          600: '#134C84',
          700: '#0E3963',
          800: '#0A2642',
          900: '#051321',
        },
        success: {
          DEFAULT: '#3B6D11',
          50: '#F0F7E8',
          100: '#E1EFD1',
          500: '#3B6D11',
          600: '#2F5710',
        },
        danger: {
          DEFAULT: '#E24B4A',
          50: '#FCEBEA',
          100: '#F9D7D6',
          500: '#E24B4A',
          600: '#C53A39',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
