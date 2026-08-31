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
        port: {
          darker: '#0B0F19',
          dark: '#111827',
          card: '#1F2937',
          border: '#374151',
          accent: '#0284C7',     // Sky Blue marítimo
          accentHover: '#0369A1',
          amber: '#F59E0B',      // Alerta / Standby
          emerald: '#10B981',    // Operacional
          rose: '#EF4444',       // Crítico / Emergencial Berço
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
