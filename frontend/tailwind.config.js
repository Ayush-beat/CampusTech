/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--color-canvas, #F7F7F2)',
        paper: 'var(--color-paper, #FFFFFF)',
        ledger: {
          DEFAULT: 'var(--color-ledger, #163D32)',
          dark: 'var(--color-ledger-dark, #0E2922)',
          light: 'var(--color-ledger-light, #235A4B)',
          soft: 'var(--color-ledger-soft, #EAF1EE)',
        },
        brand: {
          DEFAULT: 'var(--color-ledger, #163D32)',
          dark: 'var(--color-ledger-dark, #0E2922)',
          light: 'var(--color-ledger-light, #235A4B)',
          soft: 'var(--color-ledger-soft, #EAF1EE)',
        },
        sage: {
          DEFAULT: '#B9D9C4',
          light: '#D4E8DC',
          dark: '#8FB89E',
          soft: 'rgba(185, 217, 196, 0.15)',
        },
        lime: {
          DEFAULT: '#D8FF65',
          bright: '#E5FF8F',
          dark: '#B0DC2B',
          soft: 'var(--color-lime-soft, #F4FEE2)',
        },
        ink: {
          DEFAULT: 'var(--color-ink, #252A27)',
          light: 'var(--color-ink-light, #535B56)',
          muted: 'var(--color-ink-muted, #76807A)',
          subtle: 'var(--color-ink-subtle, #A2ABA6)',
        },
        terracotta: {
          DEFAULT: 'var(--color-terracotta, #B95D43)',
          light: 'var(--color-terracotta-light, #FAEDE9)',
          dark: 'var(--color-terracotta-dark, #93442E)',
        },
        warning: 'var(--color-warning, #F2C078)',
        error: 'var(--color-error, #F08C84)',
        border: {
          subtle: 'var(--color-border-subtle, #E5E5DF)',
          muted: 'var(--color-border-muted, #D8D8CF)',
        },
        surface: {
          elevated: 'var(--color-surface-elevated, #FFFFFF)',
          muted: 'var(--color-surface-muted, #ECEEE7)',
          soft: 'var(--color-surface-soft, #F2F4ED)',
          card: 'var(--color-surface-card, #FFFFFF)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        editorial: ['Newsreader', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'ledger': '10px',
        'campustech': '10px',
      },
      boxShadow: {
        'subtle': 'var(--shadow-subtle, 0 1px 2px 0 rgba(0, 0, 0, 0.03))',
        'elevated': 'var(--shadow-elevated, 0 4px 12px 0 rgba(22, 61, 50, 0.05))',
      }
    },
  },
  plugins: [],
}
