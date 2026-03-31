/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        panel: 'rgba(15, 23, 42, 0.7)',
        neon: {
          blue: '#38bdf8',
          red: '#f43f5e',
          green: '#22c55e',
          amber: '#f59e0b'
        }
      },
      boxShadow: {
        glass: '0 0 0 1px rgba(148, 163, 184, 0.15), 0 24px 80px rgba(2, 6, 23, 0.55)',
        neon: '0 0 30px rgba(56, 189, 248, 0.25)',
        danger: '0 0 30px rgba(244, 63, 94, 0.28)',
        secure: '0 0 30px rgba(34, 197, 94, 0.22)'
      }
    }
  },
  plugins: []
};
