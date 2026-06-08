/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',

  theme: {
    extend: {
      colors: {
        lime: {
          400: 'rgb(var(--primary-hover-rgb))',
          500: 'rgb(var(--primary-color-rgb))',
        },
        emerald: {
          400: 'rgb(var(--primary-hover-rgb))',
          500: 'rgb(var(--secondary-color-rgb))',
        }
      }
    },
  },
  plugins: [],
}
