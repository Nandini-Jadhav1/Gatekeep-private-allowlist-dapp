/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          900: '#070913',
          800: '#0f1429',
          700: '#192042',
          600: '#253061',
          accent: '#4f46e5',
          neon: '#6366f1',
          cyan: '#06b6d4',
          emerald: '#10b981',
        }
      }
    },
  },
  plugins: [],
}
