/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Macaron Pastel Colors
        macaron: {
          pink: '#ffc0d9',
          'pink-dark': '#ff9db7',
          lavender: '#e6d7f1',
          'lavender-dark': '#d4a8e8',
          mint: '#d4f1e8',
          'mint-dark': '#a8e6d4',
          peach: '#ffd9c4',
          'peach-dark': '#ffb399',
          sky: '#c9e4ff',
          'sky-dark': '#9ecbf0',
          lemon: '#fff5c4',
          'lemon-dark': '#ffe99e',
          rose: '#ffcfe1',
          'rose-dark': '#ffb3d1',
        },
      },
      backgroundImage: {
        'gradient-macaron-pink': 'linear-gradient(135deg, #ffc0d9 0%, #ffcfe1 100%)',
        'gradient-macaron-lavender': 'linear-gradient(135deg, #e6d7f1 0%, #d4a8e8 100%)',
        'gradient-macaron-mint': 'linear-gradient(135deg, #d4f1e8 0%, #a8e6d4 100%)',
        'gradient-macaron-sky': 'linear-gradient(135deg, #c9e4ff 0%, #9ecbf0 100%)',
        'gradient-macaron-peach': 'linear-gradient(135deg, #ffd9c4 0%, #ffb399 100%)',
        'gradient-macaron-lemon': 'linear-gradient(135deg, #fff5c4 0%, #ffe99e 100%)',
      },
      boxShadow: {
        'macaron-sm': '0 2px 8px rgba(150, 130, 200, 0.08)',
        'macaron-md': '0 4px 16px rgba(150, 130, 200, 0.12)',
        'macaron-lg': '0 8px 24px rgba(150, 130, 200, 0.15)',
        'macaron-pink': '0 4px 16px rgba(255, 192, 217, 0.3)',
      },
    },
  },
  plugins: [],
}
