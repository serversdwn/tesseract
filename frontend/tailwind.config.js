/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: '#0a0a12',
        accent: '#f97316'
      }
    }
  },
  plugins: []
}
