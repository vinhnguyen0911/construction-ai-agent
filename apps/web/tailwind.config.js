/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        accent: {
          DEFAULT: '#2E7D32',
          hover: '#1B5E20',
          light: '#C8E6C9',
          dark: '#4CAF50',
          'dark-hover': '#66BB6A',
          'dark-light': '#1B3A1B',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#161B22',
        },
        civil: {
          bg: '#FAFBFC',
          'bg-dark': '#0D1117',
          secondary: '#F0F2F5',
          'secondary-dark': '#161B22',
          border: '#E0E4E0',
          'border-dark': '#21262D',
          text: '#1A2B1A',
          'text-dark': '#E6EDE6',
          'text-secondary': '#5F6B5F',
          'text-secondary-dark': '#8B9A8B',
          muted: '#8C998C',
          'muted-dark': '#5F6B5F',
          'chat-user': '#E8F5E9',
          'chat-user-dark': '#1A2E1A',
          warning: '#E65100',
          'warning-dark': '#FF9800',
          danger: '#C62828',
        },
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
