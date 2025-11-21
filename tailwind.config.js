/** @type {import('tailwindcss').Config} */
export default {
  content: ['./client/index.html', './client/src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#009698',
        secondary: '#007a7c',
        accent: '#00b8ba',
        dark: '#2d3748',
        light: '#f8f9fa'
      }
    }
  },
  plugins: []
};
