/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyber-dark': '#050509',
        'cyber-darker': '#0a0a0f',
        'cyber-darkest': '#101018',
        'cyber-orange': '#ff6b35',
        'cyber-orange-bright': '#ff8c42',
        'cyber-orange-dim': '#cc5428',
      },
      boxShadow: {
        'cyber': '0 0 10px rgba(255, 107, 53, 0.3)',
        'cyber-lg': '0 0 20px rgba(255, 107, 53, 0.5)',
      }
    },
  },
  plugins: [],
}
