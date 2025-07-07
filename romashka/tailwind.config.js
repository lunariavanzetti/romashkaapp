/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          pink: '#FF6B9D',
          green: '#4ECDC4',
          purple: '#A259FF',
          magenta: '#FF1EAE',
          navy: '#181C2F',
          lavender: '#C3B6FF',
          neon: '#F8F8FF',
          electric: '#FF4DFE',
        },
        dark: '#0F172A',
        light: '#FFFFFF',
        glass: 'rgba(255,255,255,0.15)',
        glassDark: 'rgba(24,28,47,0.35)',
        gray: {
          700: '#64748B',
          500: '#94A3B8',
          300: '#CBD5E1',
          100: '#F1F5F9',
        },
      },
      fontFamily: {
        heading: ['Sora', 'Inter', 'sans-serif'],
        body: ['Inter', 'Source Sans Pro', 'sans-serif'],
      },
      fontWeight: {
        thin: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        neon: '0 0 8px #FF4DFE, 0 0 16px #A259FF',
      },
      backgroundImage: {
        'gradient-tech': 'linear-gradient(135deg, #181C2F 0%, #A259FF 50%, #FF1EAE 100%)',
        'circuit': 'url(/assets/circuit-bg.svg)',
      },
      borderRadius: {
        pill: '9999px',
      },
      backdropBlur: {
        glass: '12px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
}

