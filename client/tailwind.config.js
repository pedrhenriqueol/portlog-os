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
          darker: '#0A0E17',      // Deep Steel Navy base
          dark: '#0D131F',        // Sidebar & Elevated Containers
          card: '#131B2E',        // Slate metallic surface card
          cardHover: '#18233C',
          border: '#1E293B',      // Precision Slate metallic border
          borderLight: '#334155',
          cobalt: '#2563EB',      // Azul Cobalto (Primary Action)
          cobaltHover: '#1D4ED8',
          accent: '#2563EB',      // Primary Accent (Cobalt)
          accentHover: '#1D4ED8',
          amber: '#F59E0B',       // Âmbar Operacional (Alertas/SLA)
          nautical: '#F97316',    // Laranja Náutico (Emergencial Berço)
          emerald: '#10B981',     // Verde Operacional (Online/Concluído)
          rose: '#EF4444',        // Crítico
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
