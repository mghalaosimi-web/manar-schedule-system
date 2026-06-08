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
          400: 'rgb(var(--primary-hover-rgb) / <alpha-value>)',
          500: 'rgb(var(--primary-color-rgb) / <alpha-value>)',
        },
        emerald: {
          400: 'rgb(var(--primary-hover-rgb) / <alpha-value>)',
          500: 'rgb(var(--secondary-color-rgb) / <alpha-value>)',
        }
      }
    },
  },
  plugins: [],
}
