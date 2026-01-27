/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './main.{ts,tsx,js,jsx}',
    './Layout.{ts,tsx,js,jsx}',
    './Pages/**/*.{ts,tsx,js,jsx}',
    './Components/**/*.{ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {}
  },
  plugins: []
};
