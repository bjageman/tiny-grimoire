/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clocktower: {
          parchment: '#f4e4bc',
          blood: '#8b0000',
          night: '#1a1a1a',
          townsfolk: '#2563eb',
          outsider: '#10b981',
          minion: '#ef4444',
          demon: '#7f1d1d',
          traveler: '#a855f7',
        }
      }
    },
  },
  plugins: [],
}
