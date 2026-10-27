/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F7F2',
        ledger: {
          DEFAULT: '#163D32',
          dark: '#0E2922',
          light: '#235A4B',
          soft: '#EAF1EE',
        },
        lime: {
          DEFAULT: '#D8FF65',
          bright: '#E5FF8F',
          dark: '#B0DC2B',
          soft: '#F4FEE2',
        },
        paper: '#FFFFFF',
        ink: {
          DEFAULT: '#252A27',
          light: '#535B56',
          muted: '#76807A',
          subtle: '#A2ABA6',
        },
        terracotta: {
          DEFAULT: '#B95D43',
          light: '#FAEDE9',
          dark: '#93442E',
        },
        border: {
          subtle: '#E5E5DF',
          muted: '#D8D8CF',
        },
        surface: {
          muted: '#ECEEE7',
          soft: '#F2F4ED',
          card: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        editorial: ['Newsreader', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'ledger': '10px',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'elevated': '0 4px 12px 0 rgba(22, 61, 50, 0.05)',
      }
    },
  },
  plugins: [],
}
