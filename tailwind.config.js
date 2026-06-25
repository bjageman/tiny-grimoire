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
        },
        // Intermediate gray shades not in Tailwind's default palette
        gray: {
          150: '#eceef1',
          250: '#dde0e7',
          505: '#677080',
          550: '#5c6575',
          555: '#5b6474',
          650: '#424b5a',
          655: '#414a59',
          750: '#2d3748',
          850: '#161d2b',
          855: '#151b29',
          955: '#020610',
        },
      }
    },
  },
  plugins: [],
}
