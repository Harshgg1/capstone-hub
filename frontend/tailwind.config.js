export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Dynamic tint classes used by Metric component
    { pattern: /text-(indigo|emerald|amber|violet)-600/ },
    { pattern: /bg-(indigo|emerald|amber|violet)-50/ },
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],  // 11px
      },
      boxShadow: {
        'surface': '0 1px 3px rgba(20,32,55,0.04), 0 8px 24px rgba(20,32,55,0.04)',
        'surface-hover': '0 4px 12px rgba(20,32,55,0.08), 0 12px 32px rgba(20,32,55,0.06)',
        'modal': '0 24px 48px rgba(20,32,55,0.16), 0 4px 12px rgba(20,32,55,0.06)',
      },
      animation: {
        'toast-in': 'toastIn 0.28s ease-out both',
      },
      keyframes: {
        toastIn: {
          '0%': { opacity: '0', transform: 'translateY(-12px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
