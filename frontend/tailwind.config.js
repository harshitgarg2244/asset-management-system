/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: { DEFAULT: '#14152B', hover: '#1D1F3D', border: '#252748' },
        brand: {
          50: '#F1EFFE', 100: '#E4E0FD', 400: '#8B7CF6',
          500: '#6C5CE7', 600: '#5A48D8', 700: '#4936B8',
        },
        status: {
          available: '#10B981', assigned: '#6C5CE7',
          maintenance: '#F59E0B', retired: '#94A3B8',
        },
        canvas: '#F6F7FB',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      keyframes: {
        fadeInUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        slideInLeft: { '0%': { opacity: '0', transform: 'translateX(-6px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        pulseSoft: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        scaleIn: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) both',
        slideInLeft: 'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        pulseSoft: 'pulseSoft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
