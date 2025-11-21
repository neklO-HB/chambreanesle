/** @type {import('tailwindcss').Config} */
export default {
  content: ['./client/index.html', './client/src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#c45824',
        secondary: '#a0410f',
        accent: '#e37a3d',
        dark: '#2d3748',
        light: '#f8f9fa'
      }
    }
  },
  plugins: []
};
