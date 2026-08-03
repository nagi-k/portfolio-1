/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FAFAF9',
        ink: {
          DEFAULT: '#1A1B1E',
          soft: '#4B4D52',
          mute: '#8A8C91',
        },
        line: '#E7E7E4',
        accent: {
          DEFAULT: '#1E3A8A',
          soft: '#2B4BA8',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'Inter', 'system-ui', 'sans-serif'],
        en: ['Inter', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        site: '1200px',
      },
      letterSpacing: {
        widest2: '0.2em',
      },
    },
  },
  plugins: [],
}
