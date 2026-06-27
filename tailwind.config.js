export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  darkMode: 'selector',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        popover: 'var(--popover)',
        'popover-foreground': 'var(--popover-foreground)',
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        secondary: 'var(--secondary)',
        'secondary-foreground': 'var(--secondary-foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',
        destructive: 'var(--destructive)',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        'chart-1': 'var(--chart-1)',
        'chart-2': 'var(--chart-2)',
        'chart-3': 'var(--chart-3)',
        'chart-4': 'var(--chart-4)',
        'chart-5': 'var(--chart-5)',
        sidebar: 'var(--sidebar)',
        'sidebar-foreground': 'var(--sidebar-foreground)',
        'sidebar-primary': 'var(--sidebar-primary)',
        'sidebar-primary-foreground': 'var(--sidebar-primary-foreground)',
        'sidebar-accent': 'var(--sidebar-accent)',
        'sidebar-accent-foreground': 'var(--sidebar-accent-foreground)',
        'sidebar-border': 'var(--sidebar-border)',
        'sidebar-ring': 'var(--sidebar-ring)',
        'destructive-foreground': 'var(--destructive-foreground)'
      },
      fontFamily: {
        heading: ['"Bebas Neue"', 'system-ui', 'sans-serif'],
        display: ['"Bebas Neue"', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'monospace']
      },
      keyframes: {
        'loop-neon-pulse': {
          '0%,100%': { boxShadow: '0 0 10px #9CFF0F88, 0 0 28px #9CFF0F33' },
          '50%': { boxShadow: '0 0 22px #9CFF0Fcc, 0 0 56px #9CFF0F66' }
        },
        'loop-fade-up': {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        },
        'loop-dot-blink': {
          '0%,80%,100%': { opacity: 0.15 },
          '40%': { opacity: 1 }
        }
      },
      animation: {
        'loop-neon-pulse': 'loop-neon-pulse 2s ease infinite',
        'loop-fade-up': 'loop-fade-up 0.4s ease both',
        'loop-dot-blink': 'loop-dot-blink 1.3s ease infinite'
      }
    }
  }
}