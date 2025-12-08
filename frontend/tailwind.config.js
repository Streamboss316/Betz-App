module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0F',
        foreground: '#FFFFFF',
        card: '#16161D',
        'card-foreground': '#FFFFFF',
        popover: '#0A0A0F',
        'popover-foreground': '#FFFFFF',
        primary: '#8B5CF6',
        'primary-foreground': '#FFFFFF',
        secondary: '#D4AF37',
        'secondary-foreground': '#000000',
        muted: '#1F1F28',
        'muted-foreground': '#9CA3AF',
        accent: '#D4AF37',
        'accent-foreground': '#000000',
        destructive: '#EF4444',
        'destructive-foreground': '#FFFFFF',
        border: '#2D2D3A',
        input: '#1F1F28',
        ring: '#8B5CF6'
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        heading: ['Inter', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Consolas', 'monospace']
      },
      borderRadius: {
        lg: '1.25rem',
        md: '1rem',
        sm: '0.75rem'
      }
    }
  },
  plugins: []
}