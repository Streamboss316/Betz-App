module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        background: '#09090B',
        foreground: '#FAFAFA',
        card: '#18181B',
        'card-foreground': '#FAFAFA',
        popover: '#09090B',
        'popover-foreground': '#FAFAFA',
        primary: '#00E676',
        'primary-foreground': '#000000',
        secondary: '#2979FF',
        'secondary-foreground': '#FFFFFF',
        muted: '#27272A',
        'muted-foreground': '#A1A1AA',
        accent: '#FFEA00',
        'accent-foreground': '#000000',
        destructive: '#FF1744',
        'destructive-foreground': '#FFFFFF',
        border: '#27272A',
        input: '#27272A',
        ring: '#00E676'
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        heading: ['Chivo', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      borderRadius: {
        lg: '1rem',
        md: '0.75rem',
        sm: '0.5rem'
      }
    }
  },
  plugins: []
}