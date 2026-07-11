/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Open Sans', 'Arial', 'sans-serif'],
        lato: ['Lato', 'Helvetica', 'Arial', 'Lucida', 'sans-serif'],
      },
      colors: {
        'sel-purple':      '#33275f',
        'sel-lavender':    '#d4aeea',
        'sel-cream':       '#fefdff',
        'sel-body':        '#666666',
        'sel-blue':        '#2ea3f2',
        'sel-author':      '#b085b3',
        'sel-quote-icon':  '#9187ba',
      },
    },
  },
  plugins: [],
}
