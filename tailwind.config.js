/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
      },
      // Values live as RGB channels in src/index.css (:root) so the palette has one
      // source of truth and stays tweakable at runtime; <alpha-value> keeps /opacity working.
      colors: {
        clocktower: {
          parchment: 'rgb(var(--clocktower-parchment) / <alpha-value>)',
          blood: 'rgb(var(--clocktower-blood) / <alpha-value>)',
          night: 'rgb(var(--clocktower-night) / <alpha-value>)',
          townsfolk: 'rgb(var(--clocktower-townsfolk) / <alpha-value>)',
          outsider: 'rgb(var(--clocktower-outsider) / <alpha-value>)',
          minion: 'rgb(var(--clocktower-minion) / <alpha-value>)',
          demon: 'rgb(var(--clocktower-demon) / <alpha-value>)',
          traveler: 'rgb(var(--clocktower-traveler) / <alpha-value>)',
          gold: 'rgb(var(--clocktower-gold) / <alpha-value>)',
          goldDim: 'rgb(var(--clocktower-gold-dim) / <alpha-value>)',
        },
        // Intermediate gray shades not in Tailwind's default palette
        gray: {
          150: 'rgb(var(--gray-150) / <alpha-value>)',
          250: 'rgb(var(--gray-250) / <alpha-value>)',
          505: 'rgb(var(--gray-505) / <alpha-value>)',
          550: 'rgb(var(--gray-550) / <alpha-value>)',
          555: 'rgb(var(--gray-555) / <alpha-value>)',
          650: 'rgb(var(--gray-650) / <alpha-value>)',
          655: 'rgb(var(--gray-655) / <alpha-value>)',
          750: 'rgb(var(--gray-750) / <alpha-value>)',
          850: 'rgb(var(--gray-850) / <alpha-value>)',
          855: 'rgb(var(--gray-855) / <alpha-value>)',
          955: 'rgb(var(--gray-955) / <alpha-value>)',
        },
      }
    },
  },
  plugins: [],
}
