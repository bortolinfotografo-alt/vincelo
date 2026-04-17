/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/hooks/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      animation: {
        'ping-once': 'ping 0.4s cubic-bezier(0,0,0.2,1) 1',
      },
      colors: {
        primary: {
          50: '#fef7f0',
          100: '#fdedd8',
          200: '#fad6ab',
          300: '#f7b973',
          400: '#f39238',
          500: '#f17510',
          600: '#e15909',
          700: '#ba410a',
          800: '#943310',
          900: '#782c10',
        },
        surface: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
    },
  },
  plugins: [],
};
