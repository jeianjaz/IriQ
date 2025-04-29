/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'iriq-light': '#F6F8ED',
        'iriq-primary': '#7AD63D',
        'iriq-dark': '#002E1F',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'gradient-slow': 'gradient 8s ease infinite',
        'text-slide-up': 'slideUp 0.9s ease-in-out',
        'text-slide-down': 'slideDown 0.9s ease-in-out',
        'word-change': 'wordChange 1.2s ease-in-out',
        'word-fade-out': 'wordFadeOut 0.6s ease-in-out',
        'word-fade-in': 'wordFadeIn 0.6s ease-in-out',
        'float': 'float 6s ease-in-out infinite',
        'bounce-slow': 'bounce 3s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        gradient: {
          '0%': { backgroundSize: '100% 100%', backgroundPosition: '0% 0%' },
          '50%': { backgroundSize: '200% 200%', backgroundPosition: '100% 100%' },
          '100%': { backgroundSize: '100% 100%', backgroundPosition: '0% 0%' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        wordChange: {
          '0%': { transform: 'rotateX(90deg)', opacity: '0', filter: 'blur(8px)' },
          '100%': { transform: 'rotateX(0deg)', opacity: '1', filter: 'blur(0)' },
        },
        wordFadeOut: {
          '0%': { transform: 'scale(1)', opacity: '1', filter: 'blur(0)' },
          '100%': { transform: 'scale(0.95)', opacity: '0', filter: 'blur(4px)' },
        },
        wordFadeIn: {
          '0%': { transform: 'scale(1.05)', opacity: '0', filter: 'blur(4px)' },
          '100%': { transform: 'scale(1)', opacity: '1', filter: 'blur(0)' },
        },
      },
    },
  },
  plugins: [],
}
