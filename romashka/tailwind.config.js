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
        // Lyro.ai Brand Colors
        primary: {
          // Deep blues for headers and navigation
          'deep-blue': '#1a365d',
          'navy': '#1e3a8a',
          
          // Teal for accents and buttons
          'teal': '#38b2ac',
          'teal-dark': '#2d9b96',
          'teal-light': '#4fd1c7',
          
          // Orange for CTAs and highlights
          'orange': '#ed8936',
          'orange-dark': '#d69e2e',
          'orange-light': '#f6ad55',
          
          // Supporting colors
          'blue-light': '#3182ce',
          'cyan': '#00b4d8',
          'purple': '#805ad5',
          'pink': '#ed64a6',
          'green': '#48bb78',
          'yellow': '#ecc94b',
          'red': '#f56565',
          
          // Gradients
          'gradient-primary': 'linear-gradient(135deg, #1a365d 0%, #38b2ac 100%)',
          'gradient-secondary': 'linear-gradient(135deg, #38b2ac 0%, #ed8936 100%)',
          'gradient-accent': 'linear-gradient(135deg, #ed8936 0%, #1a365d 100%)',
        },
        
        // Neutral colors
        gray: {
          50: '#f7fafc',
          100: '#edf2f7',
          200: '#e2e8f0',
          300: '#cbd5e0',
          400: '#a0aec0',
          500: '#718096',
          600: '#4a5568',
          700: '#2d3748',
          800: '#1a202c',
          900: '#171923',
        },
        
        // Background colors
        'bg-primary': '#ffffff',
        'bg-secondary': '#f7fafc',
        'bg-dark': '#1a202c',
        'bg-darker': '#171923',
        
        // Glass effects
        'glass-light': 'rgba(255, 255, 255, 0.1)',
        'glass-dark': 'rgba(26, 32, 44, 0.1)',
        'glass-teal': 'rgba(56, 178, 172, 0.1)',
        'glass-orange': 'rgba(237, 137, 54, 0.1)',
        
        // Legacy support (for gradual migration)
        dark: '#1a202c',
        light: '#ffffff',
      },
      
      fontFamily: {
        'heading': ['Sora', 'Inter', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['Fira Code', 'monospace'],
      },
      
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '3.75rem',
      },
      
      boxShadow: {
        'glass': '0 4px 32px rgba(0, 0, 0, 0.1)',
        'glass-dark': '0 4px 32px rgba(0, 0, 0, 0.3)',
        'glow-teal': '0 0 20px rgba(56, 178, 172, 0.3)',
        'glow-orange': '0 0 20px rgba(237, 137, 54, 0.3)',
        'glow-blue': '0 0 20px rgba(26, 54, 93, 0.3)',
        'elevation-1': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'elevation-2': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'elevation-3': '0 8px 24px rgba(0, 0, 0, 0.1)',
      },
      
      backgroundImage: {
        'gradient-lyro': 'linear-gradient(135deg, #1a365d 0%, #38b2ac 50%, #ed8936 100%)',
        'gradient-header': 'linear-gradient(90deg, #1a365d 0%, #38b2ac 100%)',
        'gradient-button': 'linear-gradient(135deg, #38b2ac 0%, #2d9b96 100%)',
        'gradient-accent': 'linear-gradient(135deg, #ed8936 0%, #d69e2e 100%)',
        'gradient-hero': 'linear-gradient(135deg, #1a365d 0%, #38b2ac 30%, #ed8936 70%, #1a365d 100%)',
        'circuit-pattern': 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
      },
      
      backdropBlur: {
        'glass': '12px',
        'heavy': '24px',
      },
      
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        'DEFAULT': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        'full': '9999px',
      },
      
      animation: {
        'gradient-shift': 'gradient-shift 8s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'bounce-slow': 'bounce 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-down': 'slide-down 0.5s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
      },
      
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
  ],
}

