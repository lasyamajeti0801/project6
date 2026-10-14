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
        forest: {
          DEFAULT: '#14532D',
          dark: '#0F3E22',
          light: '#1B6A3B',
        },
        emerald: {
          DEFAULT: '#15803D',
          hover: '#126E34',
          subtle: '#ECFDF5',
        },
        accent: {
          DEFAULT: '#22C55E',
          glow: 'rgba(34, 197, 94, 0.25)',
        },
        charcoal: {
          50: '#F8FAFC',
          100: '#E2E8F0',
          200: '#CBD5E1',
          700: '#334155',
          800: '#1F2933',
          900: '#151D24',
          950: '#0E1318',
        },
        ivory: {
          DEFAULT: '#FAFAF7',
          warm: '#F4F4EE',
        },
        sage: {
          50: '#F4F7F4',
          100: '#E7F2E8',
          200: '#CFE3D1',
          500: '#5F8D64',
          800: '#2E4C33',
        },
        amber: {
          DEFAULT: '#F59E0B',
          warm: '#D97706',
          subtle: '#FEF3C7',
        },
        terracotta: {
          DEFAULT: '#C65D3A',
          subtle: '#FFEDD5',
        },
        alert: {
          DEFAULT: '#DC2626',
          subtle: '#FEE2E2',
        },
        borderNeutral: '#E5E7EB',
        textMuted: '#647067',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(20, 83, 45, 0.04), 0 1px 3px rgba(0, 0, 0, 0.05)',
        'card': '0 4px 20px rgba(31, 41, 51, 0.06)',
        'elevated': '0 10px 30px rgba(20, 83, 45, 0.08), 0 2px 6px rgba(0,0,0,0.04)',
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1.125rem',
      }
    },
  },
  plugins: [],
}
