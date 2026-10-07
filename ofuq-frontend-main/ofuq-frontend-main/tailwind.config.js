/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'cairo': ['Cairo', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#019EBB',
          50: '#E6F7FA',
          100: '#B3E9F2',
          200: '#80DBE9',
          300: '#4DCDE1',
          400: '#26C0D8',
          500: '#019EBB',
          600: '#017E95',
          700: '#015E6F',
          800: '#013E4A',
          900: '#001E24',
        },
      },
    },
  },
  plugins: [],
}